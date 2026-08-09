import { WorkoutData } from '@gym-tracker/types';

export interface PlateauResult {
  exerciseId: string;
  exerciseName: string;
  stagnantSessionsCount: number;
  weight: number;
  reps: number;
  insightDescription: string;
}

export function detectPlateaus(
  workouts: WorkoutData[],
  exerciseId: string
): PlateauResult | null {
  const sessions: { date: Date; maxWeight: number; repsAtMax: number }[] = [];

  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    for (const we of w.workoutExercises || []) {
      if (we.exerciseId === exerciseId) {
        let maxW = 0;
        let reps = 0;
        for (const set of we.sets || []) {
          if (set.completed && set.weight >= maxW) {
            maxW = set.weight;
            reps = set.reps;
          }
        }
        if (maxW > 0) {
          sessions.push({
            date: new Date(w.startTime),
            maxWeight: maxW,
            repsAtMax: reps,
          });
        }
      }
    }
  }

  // Sort descending by date (newest first)
  sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (sessions.length < 3) return null;

  const latest = sessions[0];
  let stagnantCount = 1;

  for (let i = 1; i < sessions.length; i++) {
    const s = sessions[i];
    const isWeightStagnant = Math.abs(s.maxWeight - latest.maxWeight) <= 1; // 1kg margin
    const isRepsStagnant = Math.abs(s.repsAtMax - latest.repsAtMax) <= 1;

    if (isWeightStagnant && isRepsStagnant) {
      stagnantCount++;
    } else {
      break;
    }
  }

  if (stagnantCount >= 3) {
    const exName = workouts.flatMap(w => w.workoutExercises).find(we => we.exerciseId === exerciseId)?.exercise.name || 'Exercise';
    return {
      exerciseId,
      exerciseName: exName,
      stagnantSessionsCount: stagnantCount,
      weight: latest.maxWeight,
      reps: latest.repsAtMax,
      insightDescription: `Your ${exName} performance (${latest.maxWeight} kg × ${latest.repsAtMax}) has remained unchanged for the last ${stagnantCount} sessions. Consider adjusting volume, tempo, or deloading.`,
    };
  }

  return null;
}
