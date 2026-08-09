import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, exercises, workouts, workoutExercises, sets, personalRecords, eq, ilike, and, desc } from '@gym-tracker/db';
import { CreateExerciseSchema } from '@gym-tracker/validation';
import { calculateEstimated1RM, calculateSetVolume } from '@gym-tracker/intelligence';
import { memoryStore, INITIAL_EXERCISES } from '../services/store.js';

export async function exerciseRoutes(fastify: FastifyInstance) {
  // GET /api/exercises
  fastify.get('/api/exercises', { preHandler: [authenticate] }, async (request, reply) => {
    const { search, muscleGroup, equipment } = request.query as {
      search?: string;
      muscleGroup?: string;
      equipment?: string;
    };

    try {
      let query = db.select().from(exercises);
      const conditions = [];

      if (search) {
        conditions.push(ilike(exercises.name, `%${search}%`));
      }
      if (muscleGroup && muscleGroup !== 'all') {
        conditions.push(eq(exercises.muscleGroup, muscleGroup));
      }
      if (equipment && equipment !== 'all') {
        conditions.push(eq(exercises.equipment, equipment));
      }

      if (conditions.length > 0) {
        // @ts-ignore
        query = query.where(and(...conditions));
      }

      const result = await query;
      if (result.length > 0) return reply.send(result);
    } catch (err) {
      // Fallthrough to memory store if DB is not reachable
    }

    // Memory Store Fallback
    let filtered = memoryStore.exercises;
    if (search) {
      filtered = filtered.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (muscleGroup && muscleGroup !== 'all') {
      filtered = filtered.filter(e => e.muscleGroup === muscleGroup);
    }
    if (equipment && equipment !== 'all') {
      filtered = filtered.filter(e => e.equipment === equipment);
    }

    return reply.send(filtered);
  });

  // POST /api/exercises (Create custom exercise)
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
      // Fallback
    }

    const newEx = {
      id: `ex-custom-${Date.now()}`,
      name: data.name,
      muscleGroup: data.muscleGroup as any,
      secondaryMuscleGroups: (data.secondaryMuscleGroups as any) || [],
      equipment: data.equipment as any,
      exerciseType: data.exerciseType as any,
      instructions: data.instructions,
      createdAt: new Date().toISOString(),
    };

    memoryStore.exercises.unshift(newEx);
    return reply.status(201).send(newEx);
  });

  // GET /api/exercises/:id
  fastify.get('/api/exercises/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const ex = await db.query.exercises.findFirst({
        where: eq(exercises.id, id),
      });

      if (ex) return reply.send(ex);
    } catch (err) {}

    const ex = memoryStore.exercises.find(e => e.id === id);
    if (!ex) return reply.status(404).send({ error: 'Exercise not found' });
    return reply.send(ex);
  });

  // GET /api/exercises/:id/history
  fastify.get('/api/exercises/:id/history', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id: exerciseId } = request.params as { id: string };

    let ex = memoryStore.exercises.find(e => e.id === exerciseId);
    let relevantWorkouts = memoryStore.workouts.filter(w =>
      w.userId === user.id && w.status === 'completed' && w.workoutExercises.some(we => we.exerciseId === exerciseId)
    );

    try {
      const dbEx = await db.query.exercises.findFirst({
        where: eq(exercises.id, exerciseId),
      });

      if (dbEx) {
        ex = dbEx as any;
        const userWorkouts = await db.query.workouts.findMany({
          where: and(eq(workouts.userId, user.id), eq(workouts.status, 'completed')),
          orderBy: [desc(workouts.startTime)],
          with: {
            workoutExercises: {
              where: eq(workoutExercises.exerciseId, exerciseId),
              with: {
                sets: true,
              },
            },
          },
        });
        if (userWorkouts.length > 0) {
          relevantWorkouts = userWorkouts as any;
        }
      }
    } catch (err) {}

    if (!ex) {
      return reply.status(404).send({ error: 'Exercise not found' });
    }

    let maxWeightOverall = 0;
    let repsAtMaxOverall = 0;
    let maxEst1RMOverall = 0;
    let totalVolumeThisMonth = 0;

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const sessionHistory = relevantWorkouts.map(w => {
      const we = w.workoutExercises.find(we => we.exerciseId === exerciseId);
      const completedSets = (we?.sets || []).filter(s => s.completed);

      let sessionVolume = 0;
      let sessionMaxWeight = 0;
      let sessionMax1RM = 0;

      for (const s of completedSets) {
        const vol = calculateSetVolume(s.weight, s.reps);
        const est1RM = calculateEstimated1RM(s.weight, s.reps);

        sessionVolume += vol;
        if (s.weight > sessionMaxWeight) {
          sessionMaxWeight = s.weight;
        }
        if (s.weight > maxWeightOverall) {
          maxWeightOverall = s.weight;
          repsAtMaxOverall = s.reps;
        }
        if (est1RM > sessionMax1RM) {
          sessionMax1RM = est1RM;
        }
        if (est1RM > maxEst1RMOverall) {
          maxEst1RMOverall = est1RM;
        }
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

    const prs = memoryStore.personalRecords.filter(p => p.userId === user.id && p.exerciseId === exerciseId);

    return reply.send({
      exercise: ex,
      currentBestWeight: maxWeightOverall,
      currentBestReps: repsAtMaxOverall,
      currentEstimated1RM: maxEst1RMOverall,
      volumeThisMonth: totalVolumeThisMonth,
      sessions: sessionHistory,
      prHistory: prs,
    });
  });
}
