export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'core'
  | 'full_body';

export type EquipmentType = 
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'other';

export type ExerciseType = 
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'time_duration';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscleGroups?: MuscleGroup[];
  equipment: EquipmentType;
  exerciseType: ExerciseType;
  instructions?: string;
  createdAt: string;
}

export interface SetData {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number | null;
  rpe?: number | null;
  completed: boolean;
  restDurationSeconds?: number | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface WorkoutExerciseData {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  notes?: string | null;
  exercise: Exercise;
  sets: SetData[];
  createdAt: string;
}

export interface WorkoutData {
  id: string;
  userId: string;
  name: string;
  startTime: string;
  endTime?: string | null;
  durationSeconds?: number | null;
  notes?: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  workoutExercises: WorkoutExerciseData[];
  createdAt: string;
  updatedAt: string;
}

export type PRType = 
  | 'heaviest_weight'
  | 'max_reps'
  | 'max_estimated_1rm'
  | 'max_set_volume';

export interface PersonalRecordData {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName?: string;
  recordType: PRType;
  weight: number;
  reps: number;
  estimated1RM: number;
  setId: string;
  achievedAt: string;
}

export interface BodyMeasurementData {
  id: string;
  userId: string;
  date: string;
  weightKg?: number | null;
  bodyFatPercentage?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  armsCm?: number | null;
  thighsCm?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface UserSettingsData {
  id: string;
  userId: string;
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'miles';
  defaultRestTimerSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsightItem {
  id: string;
  type: 'progress' | 'plateau' | 'volume' | 'consistency' | 'pr' | 'recommendation';
  title: string;
  description: string;
  category: string;
  exerciseId?: string;
  metric?: string;
  value?: number | string;
  timestamp: string;
}

export interface ExerciseHistorySummary {
  exercise: Exercise;
  currentBestWeight: number;
  currentBestReps: number;
  currentEstimated1RM: number;
  volumeThisMonth: number;
  sessions: {
    workoutId: string;
    date: string;
    workoutName: string;
    sets: SetData[];
    totalVolume: number;
    maxWeight: number;
    estimated1RM: number;
  }[];
  prHistory: PersonalRecordData[];
}

export interface DashboardSummary {
  currentWeek: {
    workoutsCompleted: number;
    trainingVolumeKg: number;
    trainingTimeSeconds: number;
    prsAchieved: number;
    frequencyPerWeek: number;
  };
  recentWorkouts: WorkoutData[];
  insights: InsightItem[];
  volumeByMuscleGroup: Record<MuscleGroup, number>;
  weeklyVolumeChart: { week: string; volume: number }[];
}
