import { WorkoutData } from '@gym-tracker/types';

export interface OverloadRecommendation {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  completedReps: number;
  suggestedWeight: number;
  insightDescription: string;
}

export function generateProgressionRecommendations(
  workouts: WorkoutData[],
  exerciseId: string
): OverloadRecommendation | null {
  const sessions: { weight: number; reps: number; date: Date }[] = [];

  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    for (const we of w.workoutExercises || []) {
      if (we.exerciseId === exerciseId) {
        for (const set of we.sets || []) {
          if (set.completed && set.reps >= 8) {
            sessions.push({
              weight: set.weight,
              reps: set.reps,
              date: new Date(w.startTime),
            });
          }
        }
      }
    }
  }

  sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (sessions.length < 2) return null;

  const first = sessions[0];
  const second = sessions[1];

  if (first.weight === second.weight && first.reps >= 8 && second.reps >= 8) {
    const suggestedW = Math.round((first.weight * 1.025) * 2) / 2; // +2.5% rounded to nearest 0.5kg
    const exName = workouts.flatMap(w => w.workoutExercises).find(we => we.exerciseId === exerciseId)?.exercise.name || 'Exercise';

    return {
      exerciseId,
      exerciseName: exName,
      currentWeight: first.weight,
      completedReps: first.reps,
      suggestedWeight: suggestedW,
      insightDescription: `You've completed ${first.weight} kg × ${first.reps} in your last 2 sessions. Consider increasing weight to ${suggestedW} kg next session.`,
    };
  }

  return null;
}
