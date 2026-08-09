import { WorkoutData, InsightItem } from '@gym-tracker/types';
import { analyzeWeeklyVolumeTrend } from './volume.js';
import { detectExerciseProgression } from './progression.js';
import { detectPlateaus } from './plateaus.js';
import { analyzeConsistency } from './consistency.js';
import { generateProgressionRecommendations } from './recommendations.js';

export { calculateEstimated1RM } from './estimated1rm.js';
export { calculateSetVolume, calculateWorkoutVolume, calculateVolumeByMuscleGroup, analyzeWeeklyVolumeTrend } from './volume.js';
export { detectExerciseProgression } from './progression.js';
export { detectPlateaus } from './plateaus.js';
export { analyzeConsistency } from './consistency.js';
export { evaluateSetForPRs } from './personal-records.js';
export { generateProgressionRecommendations } from './recommendations.js';

export function generatePersonalInsights(workouts: WorkoutData[]): InsightItem[] {
  const insights: InsightItem[] = [];
  const now = new Date().toISOString();

  // 1. Consistency Insights
  const consistency = analyzeConsistency(workouts);
  if (consistency.insightDescription) {
    insights.push({
      id: `consistency-${Date.now()}`,
      type: 'consistency',
      title: 'Workout Consistency',
      description: consistency.insightDescription,
      category: 'Consistency',
      timestamp: now,
    });
  }

  // 2. Volume Trend Insights
  const volumeTrend = analyzeWeeklyVolumeTrend(workouts);
  if (volumeTrend.insightDescription) {
    insights.push({
      id: `volume-${Date.now()}`,
      type: 'volume',
      title: 'Training Volume',
      description: volumeTrend.insightDescription,
      category: 'Volume',
      value: volumeTrend.currentWeekVolume,
      timestamp: now,
    });
  }

  // Collect unique exercises from history
  const exerciseIds = Array.from(
    new Set(
      workouts
        .flatMap(w => w.workoutExercises || [])
        .map(we => we.exerciseId)
    )
  );

  // 3. Progression, Plateau & Recommendation Insights per Exercise
  for (const exId of exerciseIds) {
    // Plateau
    const plateau = detectPlateaus(workouts, exId);
    if (plateau) {
      insights.push({
        id: `plateau-${exId}`,
        type: 'plateau',
        title: `${plateau.exerciseName} Plateau`,
        description: plateau.insightDescription,
        category: 'Plateau',
        exerciseId: exId,
        timestamp: now,
      });
    }

    // Progression
    const prog = detectExerciseProgression(workouts, exId);
    if (prog && Math.abs(prog.weightChangePercentage) >= 5) {
      insights.push({
        id: `prog-${exId}`,
        type: 'progress',
        title: `${prog.exerciseName} Progression`,
        description: prog.insightDescription,
        category: 'Progress',
        exerciseId: exId,
        value: `${prog.weightChangePercentage}%`,
        timestamp: now,
      });
    }

    // Recommendation
    const rec = generateProgressionRecommendations(workouts, exId);
    if (rec) {
      insights.push({
        id: `rec-${exId}`,
        type: 'recommendation',
        title: `Overload Advice: ${rec.exerciseName}`,
        description: rec.insightDescription,
        category: 'Recommendation',
        exerciseId: exId,
        value: `${rec.suggestedWeight} kg`,
        timestamp: now,
      });
    }
  }

  return insights;
}
