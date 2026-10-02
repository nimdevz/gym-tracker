import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, workouts, personalRecords, eq, and, asc, count } from '@gym-tracker/db';
import { calculateVolumeByMuscleGroup, analyzeWeeklyVolumeTrend, calculateWorkoutVolume } from '@gym-tracker/intelligence';
import { MuscleGroup, WorkoutData } from '@gym-tracker/types';

export async function progressRoutes(fastify: FastifyInstance) {
  fastify.get('/api/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      const userWorkouts = await db.query.workouts.findMany({
        where: and(eq(workouts.userId, user.id), eq(workouts.status, 'completed')),
        orderBy: [asc(workouts.startTime)],
        with: {
          workoutExercises: { with: { exercise: true, sets: true } },
        },
      });

      const formattedWorkouts: WorkoutData[] = userWorkouts.map((w) => ({
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
        workoutExercises: w.workoutExercises.map((we) => ({
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
          sets: we.sets.map((s) => ({
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

      const [prCount] = await db
        .select({ value: count() })
        .from(personalRecords)
        .where(eq(personalRecords.userId, user.id));

      const volumeByMuscle = calculateVolumeByMuscleGroup(formattedWorkouts);
      const volumeTrend = analyzeWeeklyVolumeTrend(formattedWorkouts);

      // Year-qualified week keys so Dec 2025 and Dec 2026 never merge.
      const weeklyVolumeMap: Record<string, number> = {};
      for (const w of formattedWorkouts) {
        const date = new Date(w.startTime);
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1).getTime();
        const weekNum = Math.ceil(((date.getTime() - startOfYear) / 86400000 + 1) / 7);
        const weekKey = `${year}-W${weekNum}`;
        weeklyVolumeMap[weekKey] = (weeklyVolumeMap[weekKey] || 0) + calculateWorkoutVolume(w);
      }

      const weeklyVolumeChart = Object.entries(weeklyVolumeMap)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([week, volume]) => ({ week, volume }));

      return reply.send({
        summary: {
          workoutsCompleted: formattedWorkouts.length,
          trainingVolumeKg: volumeTrend.currentWeekVolume,
          prsAchieved: prCount?.value ?? 0,
          weeklyTrendPercentage: volumeTrend.percentageChange,
        },
        volumeByMuscleGroup: volumeByMuscle,
        weeklyVolumeChart,
      });
    } catch (err) {
      request.log.error(err, 'GET /api/progress failed');
      return reply.status(500).send({ error: 'Failed to load progress' });
    }
  });
}
