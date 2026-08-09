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
import { PRType, WorkoutData, WorkoutExerciseData, SetData } from '@gym-tracker/types';
import { memoryStore } from '../services/store.js';

export async function workoutRoutes(fastify: FastifyInstance) {
  // GET /api/workouts/active
  fastify.get('/api/workouts/active', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      const activeWorkout = await db.query.workouts.findFirst({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'in_progress')),
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: {
                orderBy: [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      if (activeWorkout) return reply.send(activeWorkout);
    } catch (err) {}

    const activeInMemory = memoryStore.workouts.find(w => w.userId === user.id && w.status === 'in_progress');
    return reply.send(activeInMemory || null);
  });

  // GET /api/workouts (History list)
  fastify.get('/api/workouts', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      const list = await db.query.workouts.findMany({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'completed')),
        orderBy: [desc(workouts.startTime)],
        with: {
          workoutExercises: {
            orderBy: [asc(workoutExercises.order)],
            with: {
              exercise: true,
              sets: {
                orderBy: [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      if (list.length > 0) return reply.send(list);
    } catch (err) {}

    const completedMem = memoryStore.workouts.filter(w => w.userId === user.id && w.status === 'completed');
    return reply.send(completedMem);
  });

  // POST /api/workouts (Start new workout)
  fastify.post('/api/workouts', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const parseResult = StartWorkoutSchema.safeParse(request.body || {});

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    // Check active
    const activeInMemory = memoryStore.workouts.find(w => w.userId === user.id && w.status === 'in_progress');
    if (activeInMemory) {
      return reply.send(activeInMemory);
    }

    try {
      const [newWorkout] = await db
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
        where: eq(workouts.id, newWorkout.id),
        with: {
          workoutExercises: {
            with: {
              exercise: true,
              sets: true,
            },
          },
        },
      });

      if (full) return reply.status(201).send(full);
    } catch (err) {}

    const nowStr = new Date().toISOString();
    const newWorkoutMem: WorkoutData = {
      id: `w-${Date.now()}`,
      userId: user.id,
      name: data.name || 'Gym Workout',
      startTime: nowStr,
      notes: data.notes || null,
      status: 'in_progress',
      workoutExercises: [],
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    memoryStore.workouts.unshift(newWorkoutMem);
    return reply.status(201).send(newWorkoutMem);
  });

  // GET /api/workouts/:id
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
              sets: {
                orderBy: [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      if (workout) return reply.send(workout);
    } catch (err) {}

    const mem = memoryStore.workouts.find(w => w.id === id && w.userId === user.id);
    if (!mem) return reply.status(404).send({ error: 'Workout not found' });
    return reply.send(mem);
  });

  // PUT /api/workouts/:id (Complete/update workout)
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

      if (existing) {
        let durationSeconds = existing.durationSeconds;
        if (data.status === 'completed' && !durationSeconds) {
          durationSeconds = Math.round((now.getTime() - new Date(existing.startTime).getTime()) / 1000);
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
                sets: {
                  orderBy: [asc(sets.setNumber)],
                },
              },
            },
          },
        });

        if (full) return reply.send(full);
      }
    } catch (err) {}

    const mem = memoryStore.workouts.find(w => w.id === id && w.userId === user.id);
    if (!mem) return reply.status(404).send({ error: 'Workout not found' });

    if (data.name) mem.name = data.name;
    if (data.notes !== undefined) mem.notes = data.notes;
    if (data.status) mem.status = data.status;
    if (data.status === 'completed') {
      mem.endTime = now.toISOString();
      mem.durationSeconds = Math.round((now.getTime() - new Date(mem.startTime).getTime()) / 1000);
    }
    mem.updatedAt = now.toISOString();

    return reply.send(mem);
  });

  // DELETE /api/workouts/:id
  fastify.delete('/api/workouts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    try {
      await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, user.id)));
    } catch (err) {}

    memoryStore.workouts = memoryStore.workouts.filter(w => w.id !== id);
    return reply.send({ success: true, message: 'Workout deleted' });
  });

  // POST /api/workouts/:id/exercises (Add exercise to active workout)
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
        where: and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)),
        with: { workoutExercises: true },
      });

      if (workout) {
        const nextOrder = data.order ?? workout.workoutExercises.length;
        const [we] = await db
          .insert(workoutExercises)
          .values({
            workoutId,
            exerciseId: data.exerciseId,
            order: nextOrder,
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
          with: {
            exercise: true,
            sets: {
              orderBy: [asc(sets.setNumber)],
            },
          },
        });

        if (fullWE) return reply.status(201).send(fullWE);
      }
    } catch (err) {}

    const memWorkout = memoryStore.workouts.find(w => w.id === workoutId && w.userId === user.id);
    if (!memWorkout) return reply.status(404).send({ error: 'Workout not found' });

    const targetEx = memoryStore.exercises.find(e => e.id === data.exerciseId) || {
      id: data.exerciseId,
      name: 'Bench Press',
      muscleGroup: 'chest' as const,
      equipment: 'barbell' as const,
      exerciseType: 'weight_reps' as const,
      createdAt: new Date().toISOString(),
    };

    const newWeId = `we-${Date.now()}`;
    const newWE: WorkoutExerciseData = {
      id: newWeId,
      workoutId,
      exerciseId: data.exerciseId,
      order: memWorkout.workoutExercises.length,
      notes: data.notes || null,
      exercise: targetEx,
      sets: [
        {
          id: `s-${Date.now()}`,
          workoutExerciseId: newWeId,
          setNumber: 1,
          weight: 0,
          reps: 0,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    memWorkout.workoutExercises.push(newWE);
    return reply.status(201).send(newWE);
  });

  // DELETE /api/workouts/:id/exercises/:weId
  fastify.delete('/api/workouts/:id/exercises/:weId', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId, weId } = request.params as { id: string; weId: string };

    try {
      await db.delete(workoutExercises).where(eq(workoutExercises.id, weId));
    } catch (err) {}

    const memWorkout = memoryStore.workouts.find(w => w.id === workoutId);
    if (memWorkout) {
      memWorkout.workoutExercises = memWorkout.workoutExercises.filter(we => we.id !== weId);
    }

    return reply.send({ success: true, message: 'Exercise removed' });
  });

  // POST /api/workouts/:id/sets
  fastify.post('/api/workouts/:id/sets', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId } = request.params as { id: string };
    const { workoutExerciseId, setNumber, weight, reps, rir, completed } = request.body as any;

    try {
      const [newSet] = await db
        .insert(sets)
        .values({
          workoutExerciseId,
          setNumber: setNumber || 1,
          weight: weight || 0,
          reps: reps || 0,
          rir: rir ?? null,
          completed: completed ?? false,
        })
        .returning();

      if (newSet) return reply.status(201).send(newSet);
    } catch (err) {}

    const memWorkout = memoryStore.workouts.find(w => w.id === workoutId);
    const memWE = memWorkout?.workoutExercises.find(we => we.id === workoutExerciseId);

    const newSetMem: SetData = {
      id: `s-${Date.now()}`,
      workoutExerciseId,
      setNumber: setNumber || (memWE?.sets.length || 0) + 1,
      weight: weight || 0,
      reps: reps || 0,
      rir: rir ?? 2,
      completed: completed ?? false,
      createdAt: new Date().toISOString(),
    };

    if (memWE) {
      memWE.sets.push(newSetMem);
    }

    return reply.status(201).send(newSetMem);
  });

  // PUT /api/workouts/:id/sets/:setId
  fastify.put('/api/workouts/:id/sets/:setId', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId, setId } = request.params as { id: string; setId: string };
    const parseResult = UpdateSetSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    try {
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

      if (updatedSet) return reply.send(updatedSet);
    } catch (err) {}

    const memWorkout = memoryStore.workouts.find(w => w.id === workoutId);
    let targetSet: SetData | undefined = undefined;

    if (memWorkout) {
      for (const we of memWorkout.workoutExercises) {
        const found = we.sets.find(s => s.id === setId);
        if (found) {
          targetSet = found;
          break;
        }
      }
    }

    if (targetSet) {
      if (data.weight !== undefined) targetSet.weight = data.weight;
      if (data.reps !== undefined) targetSet.reps = data.reps;
      if (data.rir !== undefined) targetSet.rir = data.rir;
      if (data.completed !== undefined) targetSet.completed = data.completed;
      return reply.send(targetSet);
    }

    return reply.send({ id: setId, ...data, completed: data.completed ?? true });
  });

  // DELETE /api/workouts/:id/sets/:setId
  fastify.delete('/api/workouts/:id/sets/:setId', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: workoutId, setId } = request.params as { id: string; setId: string };

    try {
      await db.delete(sets).where(eq(sets.id, setId));
    } catch (err) {}

    const memWorkout = memoryStore.workouts.find(w => w.id === workoutId);
    if (memWorkout) {
      for (const we of memWorkout.workoutExercises) {
        we.sets = we.sets.filter(s => s.id !== setId);
      }
    }

    return reply.send({ success: true, message: 'Set deleted' });
  });
}
