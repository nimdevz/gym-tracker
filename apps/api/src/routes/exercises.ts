import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, exercises, workouts, workoutExercises, sets, personalRecords, eq, ilike, and, desc, sql } from '@gym-tracker/db';
import { CreateExerciseSchema } from '@gym-tracker/validation';
import { calculateEstimated1RM, calculateSetVolume } from '@gym-tracker/intelligence';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function exerciseRoutes(fastify: FastifyInstance) {
  // GET /api/exercises — global library, scoped filters only (exercises are shared)
  fastify.get('/api/exercises', { preHandler: [authenticate] }, async (request, reply) => {
    const { search, muscleGroup, equipment } = request.query as {
      search?: string;
      muscleGroup?: string;
      equipment?: string;
    };

    try {
      const conditions = [];

      if (search?.trim()) {
        conditions.push(ilike(exercises.name, `%${escapeLike(search.trim())}%`));
      }
      if (muscleGroup && muscleGroup !== 'all') {
        conditions.push(eq(exercises.muscleGroup, muscleGroup));
      }
      if (equipment && equipment !== 'all') {
        conditions.push(eq(exercises.equipment, equipment));
      }

      const base = db.select().from(exercises);
      const result =
        conditions.length > 0
          ? await base.where(and(...conditions)).orderBy(exercises.name)
          : await base.orderBy(exercises.name);
      return reply.send(result);
    } catch (err) {
      request.log.error(err, 'GET /api/exercises failed');
      return reply.status(500).send({ error: 'Failed to load exercises' });
    }
  });

  // POST /api/exercises
  fastify.post('/api/exercises', { preHandler: [authenticate] }, async (request, reply) => {
    const parseResult = CreateExerciseSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    try {
      const [created] = await db
        .insert(exercises)
        .values({
          name: data.name,
          muscleGroup: data.muscleGroup,
          secondaryMuscleGroups: data.secondaryMuscleGroups || [],
          equipment: data.equipment,
          exerciseType: data.exerciseType,
          instructions: data.instructions,
        })
        .returning();

      return reply.status(201).send(created);
    } catch (err: any) {
      // Unique name violation -> 409 so clients can show a useful message
      if (err?.code === '23505') {
        return reply.status(409).send({ error: 'An exercise with this name already exists' });
      }
      request.log.error(err, 'POST /api/exercises failed');
      return reply.status(500).send({ error: 'Failed to create exercise' });
    }
  });

  // GET /api/exercises/:id
  fastify.get('/api/exercises/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const ex = await db.query.exercises.findFirst({
        where: eq(exercises.id, id),
      });
      if (!ex) return reply.status(404).send({ error: 'Exercise not found' });
      return reply.send(ex);
    } catch (err) {
      request.log.error(err, 'GET /api/exercises/:id failed');
      return reply.status(500).send({ error: 'Failed to load exercise' });
    }
  });

  // GET /api/exercises/:id/history — strictly this user's completed workouts + PRs
  fastify.get('/api/exercises/:id/history', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: exerciseId } = request.params as { id: string };

    try {
      const ex = await db.query.exercises.findFirst({
        where: eq(exercises.id, exerciseId),
      });
      if (!ex) return reply.status(404).send({ error: 'Exercise not found' });

      const userWorkouts = await db.query.workouts.findMany({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'completed')),
        orderBy: [desc(workouts.startTime)],
        with: {
          workoutExercises: {
            where: eq(workoutExercises.exerciseId, exerciseId),
            with: { sets: true },
          },
        },
      });

      const relevantWorkouts = userWorkouts.filter((w) => w.workoutExercises.length > 0);

      let maxWeightOverall = 0;
      let repsAtMaxOverall = 0;
      let maxEst1RMOverall = 0;
      let totalVolumeThisMonth = 0;

      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      const sessionHistory = relevantWorkouts.map((w) => {
        const we = w.workoutExercises.find((x) => x.exerciseId === exerciseId);
        const completedSets = (we?.sets || []).filter((s) => s.completed);

        let sessionVolume = 0;
        let sessionMaxWeight = 0;
        let sessionMax1RM = 0;

        for (const s of completedSets) {
          const vol = calculateSetVolume(s.weight, s.reps);
          const est1RM = calculateEstimated1RM(s.weight, s.reps);

          sessionVolume += vol;
          if (s.weight > sessionMaxWeight) sessionMaxWeight = s.weight;
          if (s.weight > maxWeightOverall) {
            maxWeightOverall = s.weight;
            repsAtMaxOverall = s.reps;
          }
          if (est1RM > sessionMax1RM) sessionMax1RM = est1RM;
          if (est1RM > maxEst1RMOverall) maxEst1RMOverall = est1RM;
        }

        if (new Date(w.startTime) >= oneMonthAgo) {
          totalVolumeThisMonth += sessionVolume;
        }

        return {
          workoutId: w.id,
          date: w.startTime,
          workoutName: w.name,
          sets: completedSets,
          totalVolume: sessionVolume,
          maxWeight: sessionMaxWeight,
          estimated1RM: sessionMax1RM,
        };
      });

      const prs = await db.query.personalRecords.findMany({
        where: and(eq(personalRecords.userId, user.id), eq(personalRecords.exerciseId, exerciseId)),
        orderBy: [desc(personalRecords.achievedAt)],
      });

      return reply.send({
        exercise: ex,
        currentBestWeight: maxWeightOverall,
        currentBestReps: repsAtMaxOverall,
        currentEstimated1RM: maxEst1RMOverall,
        volumeThisMonth: totalVolumeThisMonth,
        sessions: sessionHistory,
        prHistory: prs,
      });
    } catch (err) {
      request.log.error(err, 'GET /api/exercises/:id/history failed');
      return reply.status(500).send({ error: 'Failed to load exercise history' });
    }
  });
}
