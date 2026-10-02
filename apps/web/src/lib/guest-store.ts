import { useSyncExternalStore } from 'react';
import {
  BodyMeasurementData,
  Exercise,
  PersonalRecordData,
  UserSettingsData,
  WorkoutData,
  ExerciseHistorySummary,
} from '@gym-tracker/types';
import { GUEST_EXERCISE_LIBRARY } from './exercise-library';
import {
  analyzeWeeklyVolumeTrend,
  calculateEstimated1RM,
  calculateSetVolume,
  calculateVolumeByMuscleGroup,
  calculateWorkoutVolume,
  evaluateSetForPRs,
  generatePersonalInsights,
} from '@gym-tracker/intelligence';

export const GUEST_USER_ID = 'guest';

const STORAGE_KEY = 'gym-tracker-guest-v1';

interface GuestState {
  workouts: WorkoutData[];
  body: BodyMeasurementData[];
  customExercises: Exercise[];
  settings: { weightUnit: 'kg' | 'lbs'; distanceUnit: 'km' | 'miles'; defaultRestTimerSeconds: number };
}

const DEFAULT_SETTINGS = { weightUnit: 'kg' as const, distanceUnit: 'km' as const, defaultRestTimerSeconds: 90 };

function loadState(): GuestState {
  if (typeof window === 'undefined') {
    return { workouts: [], body: [], customExercises: [], settings: { ...DEFAULT_SETTINGS } };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { workouts: [], body: [], customExercises: [], settings: { ...DEFAULT_SETTINGS } };
    const parsed = JSON.parse(raw);
    return {
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
      body: Array.isArray(parsed.body) ? parsed.body : [],
      customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return { workouts: [], body: [], customExercises: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

let state: GuestState = loadState();
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useGuestVersion(): number {
  return useSyncExternalStore(subscribe, stateVersion, () => 0);
}

export function useGuestStore(): GuestState {
  useGuestVersion();
  return state;
}

let version = 0;
function stateVersion() {
  return version;
}
function touch() {
  version += 1;
  persist();
}

const uid = (prefix: string) =>
  `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const nowIso = () => new Date().toISOString();

export function guestAllExercises(): Exercise[] {
  return [...state.customExercises, ...GUEST_EXERCISE_LIBRARY];
}

function findExercise(id: string): Exercise | undefined {
  return guestAllExercises().find((e) => e.id === id);
}

/* ------------------------------- workouts ------------------------------- */

export function guestActiveWorkout(): WorkoutData | null {
  return state.workouts.find((w) => w.status === 'in_progress') || null;
}

export function guestCompletedWorkouts(): WorkoutData[] {
  return [...state.workouts]
    .filter((w) => w.status === 'completed')
    .sort((a, b) => (a.startTime < b.startTime ? 1 : -1));
}

export function guestWorkoutById(id: string): WorkoutData | null {
  return state.workouts.find((w) => w.id === id) || null;
}

export function guestStartWorkout(name: string): WorkoutData {
  const existing = guestActiveWorkout();
  if (existing) return existing;
  const now = nowIso();
  const w: WorkoutData = {
    id: uid('gw'),
    userId: GUEST_USER_ID,
    name: name || 'Gym Workout',
    startTime: now,
    endTime: null,
    durationSeconds: null,
    notes: null,
    status: 'in_progress',
    workoutExercises: [],
    createdAt: now,
    updatedAt: now,
  };
  state.workouts.unshift(w);
  touch();
  return w;
}

export function guestFinishWorkout(id: string): WorkoutData | null {
  const w = guestWorkoutById(id);
  if (!w) return null;
  const now = new Date();
  w.status = 'completed';
  w.endTime = now.toISOString();
  w.durationSeconds = Math.max(0, Math.round((now.getTime() - new Date(w.startTime).getTime()) / 1000));
  w.updatedAt = now.toISOString();
  touch();
  return w;
}

export function guestDeleteWorkout(id: string) {
  state.workouts = state.workouts.filter((w) => w.id !== id);
  touch();
}

export function guestAddExercise(workoutId: string, exerciseId: string) {
  const w = guestWorkoutById(workoutId);
  const ex = findExercise(exerciseId);
  if (!w || !ex || w.status !== 'in_progress') return null;
  const now = nowIso();
  const weId = uid('gwe');
  const we = {
    id: weId,
    workoutId,
    exerciseId,
    order: w.workoutExercises.length,
    notes: null,
    exercise: ex,
    sets: [
      {
        id: uid('gs'),
        workoutExerciseId: weId,
        setNumber: 1,
        weight: 0,
        reps: 0,
        completed: false,
        createdAt: now,
      },
    ],
    createdAt: now,
  };
  w.workoutExercises.push(we as any);
  w.updatedAt = now;
  touch();
  return we;
}

export function guestRemoveExercise(workoutId: string, weId: string) {
  const w = guestWorkoutById(workoutId);
  if (!w) return;
  w.workoutExercises = w.workoutExercises.filter((we) => we.id !== weId);
  w.updatedAt = nowIso();
  touch();
}

export function guestAddSet(workoutId: string, weId: string, input: { weight: number; reps: number; rir?: number | null }) {
  const w = guestWorkoutById(workoutId);
  const we = w?.workoutExercises.find((x) => x.id === weId);
  if (!w || !we) return null;
  const now = nowIso();
  const s = {
    id: uid('gs'),
    workoutExerciseId: weId,
    setNumber: we.sets.length + 1,
    weight: input.weight ?? 0,
    reps: input.reps ?? 0,
    rir: input.rir ?? null,
    completed: false,
    createdAt: now,
  };
  we.sets.push(s as any);
  w.updatedAt = now;
  touch();
  return s;
}

export function guestUpdateSet(workoutId: string, setId: string, data: Partial<{ weight: number; reps: number; rir: number | null; completed: boolean; setNumber: number }>) {
  const w = guestWorkoutById(workoutId);
  if (!w) return null;
  for (const we of w.workoutExercises) {
    const s = we.sets.find((x) => x.id === setId);
    if (s) {
      Object.assign(s, data);
      w.updatedAt = nowIso();
      touch();
      return s;
    }
  }
  return null;
}

export function guestDeleteSet(workoutId: string, setId: string) {
  const w = guestWorkoutById(workoutId);
  if (!w) return;
  for (const we of w.workoutExercises) {
    we.sets = we.sets.filter((s) => s.id !== setId);
  }
  w.updatedAt = nowIso();
  touch();
}

/* ------------------------------ derived data ---------------------------- */

export function guestRecords(): PersonalRecordData[] {
  const completed = state.workouts.filter((w) => w.status === 'completed');
  const byExercise = new Map<string, { name: string; existing: PersonalRecordData[] }>();
  const out: PersonalRecordData[] = [];

  // Evaluate sets in chronological order so PR progression mirrors the backend.
  const ordered = [...completed].sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  for (const w of ordered) {
    for (const we of w.workoutExercises) {
      let bucket = byExercise.get(we.exerciseId);
      if (!bucket) {
        bucket = { name: we.exercise.name, existing: [] };
        byExercise.set(we.exerciseId, bucket);
      }
      for (const s of we.sets) {
        const found = evaluateSetForPRs(
          we.exerciseId,
          we.exercise.name,
          s as any,
          bucket.existing.map((p) => ({ recordType: p.recordType, weight: p.weight, reps: p.reps, estimated1RM: p.estimated1RM })),
        );
        for (const pr of found) {
          const row: PersonalRecordData = {
            id: uid('gpr'),
            userId: GUEST_USER_ID,
            exerciseId: pr.exerciseId,
            exerciseName: we.exercise.name,
            recordType: pr.recordType,
            weight: pr.weight,
            reps: pr.reps,
            estimated1RM: pr.estimated1RM,
            setId: pr.setId,
            achievedAt: w.startTime,
          };
          const prevIdx = bucket.existing.findIndex((p) => p.recordType === pr.recordType);
          if (prevIdx >= 0) {
            bucket.existing[prevIdx] = row;
            const outIdx = out.findIndex((p) => p.exerciseId === pr.exerciseId && p.recordType === pr.recordType);
            if (outIdx >= 0) out[outIdx] = row;
          } else {
            bucket.existing.push(row);
            out.push(row);
          }
        }
      }
    }
  }
  return out.sort((a, b) => (a.achievedAt < b.achievedAt ? 1 : -1));
}

export function guestProgress() {
  const completed = guestCompletedWorkouts().slice().sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  const volumeByMuscleGroup = calculateVolumeByMuscleGroup(completed);
  const trend = analyzeWeeklyVolumeTrend(completed);
  const weeklyVolumeMap: Record<string, number> = {};
  for (const w of completed) {
    const date = new Date(w.startTime);
    const year = date.getFullYear();
    const weekNum = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    const key = `${year}-W${weekNum}`;
    weeklyVolumeMap[key] = (weeklyVolumeMap[key] || 0) + calculateWorkoutVolume(w);
  }
  const weeklyVolumeChart = Object.entries(weeklyVolumeMap)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([week, volume]) => ({ week, volume }));
  return {
    summary: {
      workoutsCompleted: completed.length,
      trainingVolumeKg: trend.currentWeekVolume,
      prsAchieved: guestRecords().length,
      weeklyTrendPercentage: trend.percentageChange,
    },
    volumeByMuscleGroup,
    weeklyVolumeChart,
  };
}

export function guestInsights() {
  const completed = guestCompletedWorkouts().slice().sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  return generatePersonalInsights(completed);
}

export function guestExerciseHistory(exerciseId: string): ExerciseHistorySummary | null {
  const ex = findExercise(exerciseId);
  if (!ex) return null;
  const relevant = state.workouts.filter(
    (w) => w.status === 'completed' && w.workoutExercises.some((we) => we.exerciseId === exerciseId),
  );
  let maxWeight = 0;
  let repsAtMax = 0;
  let max1RM = 0;
  let monthVol = 0;
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const sessions = relevant.map((w) => {
    const we = w.workoutExercises.find((x) => x.exerciseId === exerciseId)!;
    const done = we.sets.filter((s) => s.completed);
    let vol = 0;
    let wMax = 0;
    let w1RM = 0;
    for (const s of done) {
      vol += calculateSetVolume(s.weight, s.reps);
      const e1 = calculateEstimated1RM(s.weight, s.reps);
      if (s.weight > wMax) wMax = s.weight;
      if (s.weight > maxWeight) {
        maxWeight = s.weight;
        repsAtMax = s.reps;
      }
      if (e1 > w1RM) w1RM = e1;
      if (e1 > max1RM) max1RM = e1;
    }
    if (new Date(w.startTime) >= monthAgo) monthVol += vol;
    return { workoutId: w.id, date: w.startTime, workoutName: w.name, sets: done, totalVolume: vol, maxWeight: wMax, estimated1RM: w1RM };
  });
  return {
    exercise: ex,
    currentBestWeight: maxWeight,
    currentBestReps: repsAtMax,
    currentEstimated1RM: max1RM,
    volumeThisMonth: monthVol,
    sessions,
    prHistory: guestRecords().filter((p) => p.exerciseId === exerciseId),
  };
}

/* ------------------------------ body/settings --------------------------- */

export function guestBodyList(): BodyMeasurementData[] {
  return [...state.body].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function guestSaveBody(input: Omit<BodyMeasurementData, 'id' | 'userId' | 'createdAt'>) {
  const existing = state.body.find((b) => b.date === input.date);
  if (existing) {
    Object.assign(existing, input);
    touch();
    return existing;
  }
  const row: BodyMeasurementData = { id: uid('gbm'), userId: GUEST_USER_ID, createdAt: nowIso(), ...input };
  state.body.unshift(row);
  touch();
  return row;
}

export function guestDeleteBody(id: string) {
  state.body = state.body.filter((b) => b.id !== id);
  touch();
}

export function guestSettings(): UserSettingsData {
  const now = nowIso();
  return {
    id: 'guest-settings',
    userId: GUEST_USER_ID,
    ...state.settings,
    createdAt: now,
    updatedAt: now,
  };
}

export function guestSaveSettings(patch: Partial<{ weightUnit: 'kg' | 'lbs'; distanceUnit: 'km' | 'miles'; defaultRestTimerSeconds: number }>) {
  Object.assign(state.settings, patch);
  touch();
  return guestSettings();
}

export function guestCounts() {
  return { workouts: state.workouts.length, body: state.body.length };
}

export function clearGuestData() {
  state = { workouts: [], body: [], customExercises: [], settings: { ...DEFAULT_SETTINGS } };
  touch();
}
