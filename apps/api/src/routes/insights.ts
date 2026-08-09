import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, workouts, eq, and, desc, asc } from '@gym-tracker/db';
import { generatePersonalInsights } from '@gym-tracker/intelligence';
import { MuscleGroup, WorkoutData } from '@gym-tracker/types';
import { memoryStore } from '../services/store.js';

export async function insightRoutes(fastify: FastifyInstance) {
  fastify.get('/api/insights', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    let formattedWorkouts: WorkoutData[] = memoryStore.workouts.filter(w => w.userId === user.id && w.status === 'completed');

    try {
      const userWorkouts = await db.query.workouts.findMany({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'completed')),
        orderBy: [asc(workouts.startTime)],
        with: {
          workoutExercises: {
            with: {
              exercise: true,
              sets: true,
            },
          },
        },
      });

      if (userWorkouts.length > 0) {
        formattedWorkouts = userWorkouts.map(w => ({
          id: w.id,
          userId: w.userId,
          name: w.name,
          startTime: w.startTime.toISOString(),
          endTime: w.endTime?.toISOString() || null,
          durationSeconds: w.durationSeconds || null,
          notes: w.notes || null,
          status: w.status as 'completed',
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
          workoutExercises: w.workoutExercises.map(we => ({
            id: we.id,
            workoutId: we.workoutId,
            exerciseId: we.exerciseId,
            order: we.order,
            notes: we.notes || null,
            createdAt: we.createdAt.toISOString(),
            exercise: {
              id: we.exercise.id,
              name: we.exercise.name,
              muscleGroup: we.exercise.muscleGroup as MuscleGroup,
              secondaryMuscleGroups: (we.exercise.secondaryMuscleGroups as MuscleGroup[]) || [],
              equipment: we.exercise.equipment as any,
              exerciseType: we.exercise.exerciseType as any,
              instructions: we.exercise.instructions || undefined,
              createdAt: we.exercise.createdAt.toISOString(),
            },
            sets: we.sets.map(s => ({
              id: s.id,
              workoutExerciseId: s.workoutExerciseId,
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              rir: s.rir,
              rpe: s.rpe,
              completed: s.completed,
              restDurationSeconds: s.restDurationSeconds,
              completedAt: s.completedAt?.toISOString() || null,
              createdAt: s.createdAt.toISOString(),
            })),
          })),
        }));
      }
    } catch (err) {}

    const insights = generatePersonalInsights(formattedWorkouts);
    return reply.send(insights);
  });
}
