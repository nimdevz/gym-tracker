import { WorkoutData } from '@gym-tracker/types';

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  initialWeight: number;
  initialReps: number;
  latestWeight: number;
  latestReps: number;
  weightChangePercentage: number;
  timeframeWeeks: number;
  insightDescription: string;
}

export function detectExerciseProgression(
  workouts: WorkoutData[],
  exerciseId: string
): ExerciseProgression | null {
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

  sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  if (sessions.length < 2) return null;

  const first = sessions[0];
  const last = sessions[sessions.length - 1];

  const diffTime = Math.abs(last.date.getTime() - first.date.getTime());
  const timeframeWeeks = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24 * 7)));

  if (first.maxWeight === 0) return null;
  const pct = Math.round(((last.maxWeight - first.maxWeight) / first.maxWeight) * 1000) / 10;

  const exName = workouts.flatMap(w => w.workoutExercises).find(we => we.exerciseId === exerciseId)?.exercise.name || 'Exercise';

  const insightDescription = `Your ${exName} performance has changed ${pct >= 0 ? '+' : ''}${pct}% over the last ${timeframeWeeks} weeks (${first.maxWeight} kg x ${first.repsAtMax} → ${last.maxWeight} kg x ${last.repsAtMax}).`;

  return {
    exerciseId,
    exerciseName: exName,
    initialWeight: first.maxWeight,
    initialReps: first.repsAtMax,
    latestWeight: last.maxWeight,
    latestReps: last.repsAtMax,
    weightChangePercentage: pct,
    timeframeWeeks,
    insightDescription,
  };
}
