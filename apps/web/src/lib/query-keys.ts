/**
 * Single source of truth for React Query keys.
 * Every page that reads the same endpoint MUST use the same key so that
 * one mutation invalidates all of them and data stays in sync app-wide.
 */
export const qk = {
  me: ['userSettings'] as const, // GET /api/users/me
  activeWorkout: ['activeWorkout'] as const, // GET /api/workouts/active
  workoutHistory: ['workoutHistory'] as const, // GET /api/workouts
  workoutDetail: (id: string) => ['workout', id] as const, // GET /api/workouts/:id
  progress: ['progress'] as const, // GET /api/progress (dashboard + progress page share this)
  insights: ['insights'] as const, // GET /api/insights
  records: ['personalRecords'] as const, // GET /api/records
  bodyMeasurements: ['bodyMeasurements'] as const, // GET /api/body-measurements
  exerciseLibrary: (search: string, muscle: string) => ['exercisesLibrary', search, muscle] as const,
  exerciseHistory: (id: string) => ['exerciseHistory', id] as const,
} as const;

/** Invalidate every workout-derived key after a workout mutation. */
export const workoutRelatedKeys = [
  qk.activeWorkout,
  qk.workoutHistory,
  qk.progress,
  qk.insights,
  qk.records,
] as const;
