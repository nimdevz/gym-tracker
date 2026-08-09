/**
 * Calculate Estimated 1RM using the Epley formula:
 * 1RM = weight * (1 + reps / 30)
 * 
 * Includes a sensible cap on reps (max 15 reps evaluated) to prevent 
 * misleadingly inflated estimates from ultra-high rep sets.
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  
  const cappedReps = Math.min(reps, 15);
  const epley = weight * (1 + cappedReps / 30);
  return Math.round(epley * 10) / 10;
}
