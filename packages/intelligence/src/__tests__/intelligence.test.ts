import { describe, it, expect } from 'vitest';
import { calculateEstimated1RM } from '../estimated1rm.js';
import { calculateSetVolume, analyzeWeeklyVolumeTrend } from '../volume.js';
import { detectPlateaus } from '../plateaus.js';
import { evaluateSetForPRs } from '../personal-records.js';
import { WorkoutData } from '@gym-tracker/types';

describe('Intelligence Engine Unit Tests', () => {
  it('should calculate estimated 1RM accurately using Epley formula with rep cap', () => {
    // 80 kg * (1 + 8/30) = 80 * 1.2666 = 101.3
    expect(calculateEstimated1RM(80, 8)).toBe(101.3);
    expect(calculateEstimated1RM(100, 1)).toBe(100);
    // Reps over 15 should be capped at 15
    const capped1RM = calculateEstimated1RM(50, 30);
    const expectedCapped = 50 * (1 + 15 / 30); // 75
    expect(capped1RM).toBe(expectedCapped);
  });

  it('should calculate set volume correctly', () => {
    expect(calculateSetVolume(80, 8)).toBe(640);
    expect(calculateSetVolume(0, 10)).toBe(0);
  });

  it('should detect plateaus when performance is stagnant across 3 sessions', () => {
    const workouts: WorkoutData[] = [
      {
        id: 'w1',
        userId: 'u1',
        name: 'Workout 1',
        startTime: '2026-08-01T10:00:00Z',
        status: 'completed',
        workoutExercises: [
          {
            id: 'we1',
            workoutId: 'w1',
            exerciseId: 'ex-squat',
            order: 1,
            exercise: { id: 'ex-squat', name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell', exerciseType: 'weight_reps', createdAt: '' },
            sets: [{ id: 's1', workoutExerciseId: 'we1', setNumber: 1, weight: 100, reps: 5, completed: true, createdAt: '' }],
            createdAt: '',
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'w2',
        userId: 'u1',
        name: 'Workout 2',
        startTime: '2026-08-04T10:00:00Z',
        status: 'completed',
        workoutExercises: [
          {
            id: 'we2',
            workoutId: 'w2',
            exerciseId: 'ex-squat',
            order: 1,
            exercise: { id: 'ex-squat', name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell', exerciseType: 'weight_reps', createdAt: '' },
            sets: [{ id: 's2', workoutExerciseId: 'we2', setNumber: 1, weight: 100, reps: 5, completed: true, createdAt: '' }],
            createdAt: '',
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'w3',
        userId: 'u1',
        name: 'Workout 3',
        startTime: '2026-08-07T10:00:00Z',
        status: 'completed',
        workoutExercises: [
          {
            id: 'we3',
            workoutId: 'w3',
            exerciseId: 'ex-squat',
            order: 1,
            exercise: { id: 'ex-squat', name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell', exerciseType: 'weight_reps', createdAt: '' },
            sets: [{ id: 's3', workoutExerciseId: 'we3', setNumber: 1, weight: 100, reps: 5, completed: true, createdAt: '' }],
            createdAt: '',
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
    ];

    const plateau = detectPlateaus(workouts, 'ex-squat');
    expect(plateau).not.toBeNull();
    expect(plateau?.stagnantSessionsCount).toBe(3);
    expect(plateau?.exerciseName).toBe('Barbell Back Squat');
  });

  it('should automatically detect PRs when current set exceeds previous bests', () => {
    const currentSet = {
      id: 'set-new-pr',
      workoutExerciseId: 'we1',
      setNumber: 1,
      weight: 100,
      reps: 8,
      completed: true,
      createdAt: '',
    };

    const existingPRs = [
      { recordType: 'heaviest_weight' as const, weight: 90, reps: 8, estimated1RM: 114 },
    ];

    const prs = evaluateSetForPRs('ex-bench', 'Bench Press', currentSet, existingPRs);
    expect(prs.length).toBeGreaterThan(0);
    const heaviestPR = prs.find(p => p.recordType === 'heaviest_weight');
    expect(heaviestPR).toBeDefined();
    expect(heaviestPR?.newValue).toBe(100);
  });
});
