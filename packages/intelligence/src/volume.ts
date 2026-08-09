import { WorkoutData, MuscleGroup } from '@gym-tracker/types';

export function calculateSetVolume(weight: number, reps: number): number {
  if (weight < 0 || reps < 0) return 0;
  return weight * reps;
}

export function calculateWorkoutVolume(workout: WorkoutData): number {
  let totalVolume = 0;
  for (const we of workout.workoutExercises || []) {
    for (const set of we.sets || []) {
      if (set.completed) {
        totalVolume += calculateSetVolume(set.weight, set.reps);
      }
    }
  }
  return totalVolume;
}

export function calculateVolumeByMuscleGroup(workouts: WorkoutData[]): Record<MuscleGroup, number> {
  const result: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    shoulders: 0,
    legs: 0,
    arms: 0,
    core: 0,
    full_body: 0,
  };

  for (const workout of workouts) {
    if (workout.status !== 'completed') continue;
    for (const we of workout.workoutExercises || []) {
      const group = we.exercise.muscleGroup as MuscleGroup;
      let exVolume = 0;
      for (const set of we.sets || []) {
        if (set.completed) {
          exVolume += calculateSetVolume(set.weight, set.reps);
        }
      }
      if (group && result[group] !== undefined) {
        result[group] += exVolume;
      }
    }
  }

  return result;
}

export function analyzeWeeklyVolumeTrend(workouts: WorkoutData[]): {
  currentWeekVolume: number;
  previous4WeekAvgVolume: number;
  percentageChange: number;
  insightDescription?: string;
} {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fiveWeeksAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);

  let currentWeekVol = 0;
  let past4WeeksVol = 0;

  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    const wDate = new Date(w.startTime);
    const vol = calculateWorkoutVolume(w);

    if (wDate >= oneWeekAgo) {
      currentWeekVol += vol;
    } else if (wDate >= fiveWeeksAgo) {
      past4WeeksVol += vol;
    }
  }

  const prevAvg = past4WeeksVol / 4;
  let changePct = 0;
  if (prevAvg > 0) {
    changePct = Math.round(((currentWeekVol - prevAvg) / prevAvg) * 1000) / 10;
  }

  let description: string | undefined;
  if (prevAvg > 0 && Math.abs(changePct) >= 10) {
    const direction = changePct > 0 ? 'higher' : 'lower';
    description = `Your weekly training volume (${currentWeekVol.toLocaleString()} kg) is ${Math.abs(changePct)}% ${direction} than your 4-week average.`;
  }

  return {
    currentWeekVolume: currentWeekVol,
    previous4WeekAvgVolume: prevAvg,
    percentageChange: changePct,
    insightDescription: description,
  };
}
