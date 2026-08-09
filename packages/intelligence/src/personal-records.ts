import { SetData, PRType } from '@gym-tracker/types';
import { calculateEstimated1RM } from './estimated1rm.js';
import { calculateSetVolume } from './volume.js';

export interface DiscoveredPR {
  exerciseId: string;
  recordType: PRType;
  weight: number;
  reps: number;
  estimated1RM: number;
  setId: string;
  previousBestValue: number;
  newValue: number;
  insightDescription: string;
}

export function evaluateSetForPRs(
  exerciseId: string,
  exerciseName: string,
  currentSet: SetData,
  existingPRs: { recordType: PRType; weight: number; reps: number; estimated1RM: number }[]
): DiscoveredPR[] {
  if (!currentSet.completed || currentSet.weight <= 0 || currentSet.reps <= 0) return [];

  const discovered: DiscoveredPR[] = [];
  const est1RM = calculateEstimated1RM(currentSet.weight, currentSet.reps);
  const setVolume = calculateSetVolume(currentSet.weight, currentSet.reps);

  // 1. Heaviest Weight
  const heaviestPR = existingPRs.find(p => p.recordType === 'heaviest_weight');
  const prevHeaviest = heaviestPR ? heaviestPR.weight : 0;
  if (currentSet.weight > prevHeaviest) {
    discovered.push({
      exerciseId,
      recordType: 'heaviest_weight',
      weight: currentSet.weight,
      reps: currentSet.reps,
      estimated1RM: est1RM,
      setId: currentSet.id,
      previousBestValue: prevHeaviest,
      newValue: currentSet.weight,
      insightDescription: `New ${exerciseName} PR: Heaviest weight lifted ${currentSet.weight} kg (${currentSet.reps} reps).`,
    });
  }

  // 2. Highest Estimated 1RM
  const est1RMPR = existingPRs.find(p => p.recordType === 'max_estimated_1rm');
  const prev1RM = est1RMPR ? est1RMPR.estimated1RM : 0;
  if (est1RM > prev1RM) {
    discovered.push({
      exerciseId,
      recordType: 'max_estimated_1rm',
      weight: currentSet.weight,
      reps: currentSet.reps,
      estimated1RM: est1RM,
      setId: currentSet.id,
      previousBestValue: prev1RM,
      newValue: est1RM,
      insightDescription: `New ${exerciseName} Estimated 1RM PR: ${est1RM} kg (${currentSet.weight} kg × ${currentSet.reps} reps).`,
    });
  }

  // 3. Max Set Volume
  const volPR = existingPRs.find(p => p.recordType === 'max_set_volume');
  const prevVol = volPR ? (volPR.weight * volPR.reps) : 0;
  if (setVolume > prevVol) {
    discovered.push({
      exerciseId,
      recordType: 'max_set_volume',
      weight: currentSet.weight,
      reps: currentSet.reps,
      estimated1RM: est1RM,
      setId: currentSet.id,
      previousBestValue: prevVol,
      newValue: setVolume,
      insightDescription: `New ${exerciseName} Single Set Volume PR: ${setVolume.toLocaleString()} kg (${currentSet.weight} kg × ${currentSet.reps} reps).`,
    });
  }

  return discovered;
}
