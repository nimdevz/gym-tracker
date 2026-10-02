import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, workouts, workoutExercises, sets, exercises, personalRecords, eq, and, desc, asc } from '@gym-tracker/db';
import {
  StartWorkoutSchema,
  UpdateWorkoutSchema,
  AddWorkoutExerciseSchema,
  CreateSetSchema,
  UpdateSetSchema,
} from '@gym-tracker/validation';
import { evaluateSetForPRs } from '@gym-tracker/intelligence';

function workoutDetails() {
  return {
    workoutExercises: {
      orderBy: [asc(workoutExercises.order)],
      with: {
        exercise: true,
        sets: { orderBy: [asc(sets.setNumber)] },
      },
    },
  };
}

const workoutWithDetails = workoutDetails();

/** Evaluate a completed set against this user's existing PRs and persist new ones. */
async function persistNewPRs(userId: string, exerciseId: string, exerciseName: string, setRow: typeof sets.$inferSelect) {
  if (!setRow.completed) return;
  const existing = await db.query.personalRecords.findMany({
    where: and(eq(personalRecords.userId, userId), eq(personalRecords.exerciseId, exerciseId)),
  });
  const found = evaluateSetForPRs(
    exerciseId,
    exerciseName,
    {
      id: setRow.id,
      weight: setRow.weight,
      reps: setRow.reps,
      completed: setRow.completed,
    } as any,
    existing.map((p) => ({ recordType: p.recordType as any, weight: p.weight, reps: p.reps, estimated1RM: p.estimated1RM })),
  );
  for (const pr of found) {
    // One row per record type: update if exists, insert otherwise.
    const prev = existing.find((p) => p.recordType === pr.recordType);
    if (prev) {
      await db
        .update(personalRecords)
        .set({
          weight: pr.weight,
          reps: pr.reps,
          estimated1RM: pr.estimated1RM,
          setId: pr.setId,
          achievedAt: new Date(),
        })
        .where(eq(personalRecords.id, prev.id));
    } else {
      await db.insert(personalRecords).values({
        userId,
        exerciseId,
        recordType: pr.recordType,
        weight: pr.weight,
        reps: pr.reps,
        estimated1RM: pr.estimated1RM,
        setId: pr.setId,
      });
    }
  }
}

export async function workoutRoutes(fastify: FastifyInstance) {
  // GET /api/workouts/active
  fastify.get('/api/workouts/active', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    try {
      const active = await db.query.workouts.findFirst({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'in_progress')),
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: { orderBy: [asc(sets.setNumber)] },
            },
          },
        },
      });
      return reply.send(active || null);
    } catch (err) {
      request.log.error(err, 'GET /api/workouts/active failed');
      return reply.status(500).send({ error: 'Failed to load active workout' });
    }
  });

  // GET /api/workouts (completed history, newest first, capped)
  fastify.get('/api/workouts', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { limit } = request.query as { limit?: string };
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
    try {
      const list = await db.query.workouts.findMany({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'completed')),
        orderBy: [desc(workouts.startTime)],
        limit: take,
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: { orderBy: [asc(sets.setNumber)] },
            },
          },
        },
      });
      return reply.send(list);
    } catch (err) {
      request.log.error(err, 'GET /api/workouts failed');
      return reply.status(500).send({ error: 'Failed to load workouts' });
    }
  });

  // POST /api/workouts (start; returns existing active workout for this user)
  fastify.post('/api/workouts', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const parseResult = StartWorkoutSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }
    const data = parseResult.data;

    try {
      const existingActive = await db.query.workouts.findFirst({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'in_progress')),
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: { orderBy: [asc(sets.setNumber)] },
            },
          },
        },
      });
      if (existingActive) return reply.send(existingActive);

      const [created] = await db
        .insert(workouts)
        .values({
          userId: user.id,
          name: data.name || 'Gym Workout',
          notes: data.notes,
          startTime: new Date(),
          status: 'in_progress',
        })
        .returning();

      const full = await db.query.workouts.findFirst({
        where: eq(workouts.id, created.id),
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: { orderBy: [asc(sets.setNumber)] },
            },
          },
        },
      });
      return reply.status(201).send(full);
    } catch (err) {
      request.log.error(err, 'POST /api/workouts failed');
      return reply.status(500).send({ error: 'Failed to start workout' });
    }
  });

  // GET /api/workouts/:id (owner only)
  fastify.get('/api/workouts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    try {
      const workout = await db.query.workouts.findFirst({
        where: and(eq(workouts.id, id), eq(workouts.userId, user.id)),
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: { orderBy: [asc(sets.setNumber)] },
            },
          },
        },
      });
      if (!workout) return reply.status(404).send({ error: 'Workout not found' });
      return reply.send(workout);
    } catch (err) {
      request.log.error(err, 'GET /api/workouts/:id failed');
      return reply.status(500).send({ error: 'Failed to load workout' });
    }
  });

  // PUT /api/workouts/:id (complete/update, owner only)
  fastify.put('/api/workouts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const parseResult = UpdateWorkoutSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }
    const data = parseResult.data;
    const now = new Date();

    try {
      const existing = await db.query.workouts.findFirst({
        where: and(eq(workouts.id, id), eq(workouts.userId, user.id)),
      });
      if (!existing) return reply.status(404).send({ error: 'Workout not found' });

      let durationSeconds = existing.durationSeconds;
      if (data.status === 'completed' && !durationSeconds) {
        durationSeconds = Math.max(0, Math.round((now.getTime() - new Date(existing.startTime).getTime()) / 1000));
      }

      const [updated] = await db
        .update(workouts)
        .set({
          ...(data.name ? { name: data.name } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.status === 'completed' ? { endTime: now, durationSeconds } : {}),
          updatedAt: now,
        })
        .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))
        .returning();

      const full = await db.query.workouts.findFirst({
        where: eq(workouts.id, updated.id),
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: { orderBy: [asc(sets.setNumber)] },
            },
          },
        },
      });
      return reply.send(full);
    } catch (err) {
      request.log.error(err, 'PUT /api/workouts/:id failed');
      return reply.status(500).send({ error: 'Failed to update workout' });
    }
  });

  // DELETE /api/workouts/:id (owner only)
  fastify.delete('/api/workouts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    try {
      const existing = await db.query.workouts.findFirst({
        where: and(eq(workouts.id, id), eq(workouts.userId, user.id)),
      });
      if (!existing) return reply.status(404).send({ error: 'Workout not found' });
      await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, user.id)));
      return reply.send({ success: true, message: 'Workout deleted' });
    } catch (err) {
      request.log.error(err, 'DELETE /api/workouts/:id failed');
      return reply.status(500).send({ error: 'Failed to delete workout' });
    }
  });

  // POST /api/workouts/:id/exercises
  fastify.post('/api/workouts/:id/exercises', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId } = request.params as { id: string };
    const parseResult = AddWorkoutExerciseSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }
    const data = parseResult.data;

    try {
      const workout = await db.query.workouts.findFirst({
        where: and(eq(workouts.userId, user.id), eq(workouts.id, workoutId)),
        with: { workoutExercises: true },
      });
      if (!workout) return reply.status(404).send({ error: 'Workout not found' });
      if (workout.status !== 'in_progress') {
        return reply.status(400).send({ error: 'Cannot modify a completed workout' });
      }

      const exercise = await db.query.exercises.findFirst({
        where: eq(exercises.id, data.exerciseId),
      });
      if (!exercise) return reply.status(404).send({ error: 'Exercise not found' });

      const [we] = await db
        .insert(workoutExercises)
        .values({
          workoutId,
          exerciseId: data.exerciseId,
          order: data.order ?? workout.workoutExercises.length,
          notes: data.notes,
        })
        .returning();

      await db.insert(sets).values({
        workoutExerciseId: we.id,
        setNumber: 1,
        weight: 0,
        reps: 0,
        completed: false,
      });

      const fullWE = await db.query.workoutExercises.findFirst({
        where: eq(workoutExercises.id, we.id),
        with: { exercise: true, sets: { orderBy: [asc(sets.setNumber)] } },
      });
      return reply.status(201).send(fullWE);
    } catch (err) {
      request.log.error(err, 'POST /api/workouts/:id/exercises failed');
      return reply.status(500).send({ error: 'Failed to add exercise' });
    }
  });

  // DELETE /api/workouts/:id/exercises/:weId (owner only)
  fastify.delete('/api/workouts/:id/exercises/:weId', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId, weId } = request.params as { id: string; weId: string };
    try {
      const owned = await db.query.workoutExercises.findFirst({
        where: eq(workoutExercises.id, weId),
        with: { workout: true },
      });
      if (!owned || (owned as any).workoutId !== workoutId) {
        return reply.status(404).send({ error: 'Exercise not found' });
      }
      if ((owned as any).workout?.userId !== user.id) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      await db.delete(workoutExercises).where(eq(workoutExercises.id, weId));
      return reply.send({ success: true, message: 'Exercise removed' });
    } catch (err) {
      request.log.error(err, 'DELETE workout exercise failed');
      return reply.status(500).send({ error: 'Failed to remove exercise' });
    }
  });

  // POST /api/workouts/:id/sets
  fastify.post('/api/workouts/:id/sets', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId } = request.params as { id: string };
    const raw = request.body as any;
    const workoutExerciseId: string | undefined = raw?.workoutExerciseId;
    if (!workoutExerciseId) {
      return reply.status(400).send({ error: 'workoutExerciseId is required' });
    }
    const parseResult = CreateSetSchema.safeParse(raw);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }
    const { setNumber, weight, reps, rir, completed } = parseResult.data as any;

    try {
      const we = await db.query.workoutExercises.findFirst({
        where: eq(workoutExercises.id, workoutExerciseId),
        with: { workout: true, exercise: true },
      });
      if (!we || (we as any).workoutId !== workoutId || (we as any).workout?.userId !== user.id) {
        return reply.status(404).send({ error: 'Workout exercise not found' });
      }
      const [newSet] = await db
        .insert(sets)
        .values({
          workoutExerciseId,
          setNumber: setNumber || 1,
          weight: weight ?? 0,
          reps: reps ?? 0,
          rir: rir ?? null,
          completed: completed ?? false,
        })
        .returning();

      try {
        await persistNewPRs(user.id, we.exerciseId, (we as any).exercise?.name || 'Exercise', newSet);
      } catch (prErr) {
        request.log.warn(prErr, 'PR evaluation failed (non-fatal)');
      }

      return reply.status(201).send(newSet);
    } catch (err) {
      request.log.error(err, 'POST set failed');
      return reply.status(500).send({ error: 'Failed to add set' });
    }
  });

  // PUT /api/workouts/:id/sets/:setId (owner only)
  fastify.put('/api/workouts/:id/sets/:setId', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId, setId } = request.params as { id: string; setId: string };
    const parseResult = UpdateSetSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }
    const data = parseResult.data;

    try {
      const existing = await db.query.sets.findFirst({
        where: eq(sets.id, setId),
        with: { workoutExercise: { with: { workout: true, exercise: true } } },
      });
      if (!existing) return reply.status(404).send({ error: 'Set not found' });
      const ownerId = (existing as any)?.workoutExercise?.workout?.userId;
      const parentWorkoutId = (existing as any)?.workoutExercise?.workoutId;
      if (ownerId !== user.id || parentWorkoutId !== workoutId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      const [updatedSet] = await db
        .update(sets)
        .set({
          ...(data.setNumber !== undefined ? { setNumber: data.setNumber } : {}),
          ...(data.weight !== undefined ? { weight: data.weight } : {}),
          ...(data.reps !== undefined ? { reps: data.reps } : {}),
          ...(data.rir !== undefined ? { rir: data.rir } : {}),
          ...(data.completed !== undefined ? { completed: data.completed } : {}),
        })
        .where(eq(sets.id, setId))
        .returning();

      try {
        await persistNewPRs(
          user.id,
          (existing as any).workoutExercise.exerciseId,
          (existing as any).workoutExercise?.exercise?.name || 'Exercise',
          updatedSet,
        );
      } catch (prErr) {
        request.log.warn(prErr, 'PR evaluation failed (non-fatal)');
      }

      return reply.send(updatedSet);
    } catch (err) {
      request.log.error(err, 'PUT set failed');
      return reply.status(500).send({ error: 'Failed to update set' });
    }
  });

  // DELETE /api/workouts/:id/sets/:setId (owner only)
  fastify.delete('/api/workouts/:id/sets/:setId', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { setId } = request.params as { id: string; setId: string };
    try {
      const existing = await db.query.sets.findFirst({
        where: eq(sets.id, setId),
        with: { workoutExercise: { with: { workout: true } } },
      });
      if (!existing) return reply.status(404).send({ error: 'Set not found' });
      if ((existing as any)?.workoutExercise?.workout?.userId !== user.id) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      await db.delete(sets).where(eq(sets.id, setId));
      return reply.send({ success: true, message: 'Set deleted' });
    } catch (err) {
      request.log.error(err, 'DELETE set failed');
      return reply.status(500).send({ error: 'Failed to delete set' });
    }
  });
}

