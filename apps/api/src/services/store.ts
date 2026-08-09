import { Exercise, WorkoutData, PersonalRecordData, BodyMeasurementData, UserSettingsData, InsightItem } from '@gym-tracker/types';
import { db, sql } from '@gym-tracker/db';

export const INITIAL_EXERCISES: Exercise[] = [
  // Chest
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Lie flat on the bench, grip the barbell slightly wider than shoulder-width, lower to mid-chest, and press explosively upwards.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-incline-bench',
    name: 'Incline Barbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Set bench to 30-45 degrees angle. Lower bar to upper chest and press vertically.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-db-bench',
    name: 'Dumbbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Lie flat on bench holding dumbbells above chest. Lower until elbows reach 90 degrees and press back together.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-incline-db',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Incline bench at 30 degrees. Press dumbbells overhead emphasizing upper chest activation.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-cable-fly',
    name: 'Cable Fly',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Stand between dual cable towers, bring handles together in front of chest in a hugging motion.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-pec-deck',
    name: 'Pec Deck',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders'],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Sit in machine with elbows at 90 degrees. Squeeze handles together focusing on pectoral contraction.',
    createdAt: new Date().toISOString(),
  },

  // Back
  {
    id: 'ex-deadlift',
    name: 'Deadlift',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['legs', 'core'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand with feet hip-width under bar. Hinge hips back, grip bar, keep flat back, and drive through heels.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-barbell-row',
    name: 'Barbell Row',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Hinge forward at 45 degrees, pull barbell towards lower ribcage, squeezing lats at top.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-seated-row',
    name: 'Seated Cable Row',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Sit facing cable machine, pull handle to abdomen keeping chest high.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Sit down, grip wide bar, pull bar down towards upper chest while retracting shoulder blades.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-pullup',
    name: 'Pull-Up',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'bodyweight',
    exerciseType: 'bodyweight_reps',
    instructions: 'Overhand grip on pull-up bar wider than shoulders. Pull chest up to bar.',
    createdAt: new Date().toISOString(),
  },

  // Shoulders
  {
    id: 'ex-overhead-press',
    name: 'Overhead Press',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['arms', 'core'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand tall with barbell on front shoulders. Press weight straight overhead to full lockout.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-db-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Seated or standing, hold dumbbells at ear level and press upward overhead.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-lateral-raise',
    name: 'Lateral Raise',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Hold dumbbells at sides with slight elbow bend. Raise arms out sideways until parallel to floor.',
    createdAt: new Date().toISOString(),
  },

  // Legs
  {
    id: 'ex-barbell-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'legs',
    secondaryMuscleGroups: ['core', 'back'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Rest barbell on upper traps. Squat down until thighs are parallel to ground, drive up through heels.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-leg-press',
    name: 'Leg Press',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Place feet shoulder-width on footplate. Lower sled smoothly to 90 degrees, press back up.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-rdl',
    name: 'Romanian Deadlift',
    muscleGroup: 'legs',
    secondaryMuscleGroups: ['back'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand holding barbell. Hinge hips back with slight knee bend until deep hamstring stretch is felt.',
    createdAt: new Date().toISOString(),
  },

  // Arms
  {
    id: 'ex-barbell-curl',
    name: 'Barbell Curl',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Underhand grip on barbell. Keep upper arms stationary and curl bar towards chest.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-tricep-pushdown',
    name: 'Tricep Pushdown',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Attach bar or rope to high pulley. Keep elbows tucked at sides and push bar down to full extension.',
    createdAt: new Date().toISOString(),
  },
];

class MemoryStore {
  public exercises: Exercise[] = [...INITIAL_EXERCISES];
  public workouts: WorkoutData[] = [];
  public personalRecords: PersonalRecordData[] = [];
  public bodyMeasurements: BodyMeasurementData[] = [];
  public userSettings: UserSettingsData = {
    id: 'default-settings',
    userId: 'dev-user-001',
    weightUnit: 'kg',
    distanceUnit: 'km',
    defaultRestTimerSeconds: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const memoryStore = new MemoryStore();

let isPostgresAvailable: boolean | null = null;
let lastCheckTime = 0;

export async function isDbAvailable(): Promise<boolean> {
  const now = Date.now();
  if (isPostgresAvailable !== null && now - lastCheckTime < 15000) {
    return isPostgresAvailable;
  }

  lastCheckTime = now;
  try {
    const testPromise = db.execute(sql`SELECT 1`);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 150)
    );

    await Promise.race([testPromise, timeoutPromise]);
    isPostgresAvailable = true;
    return true;
  } catch (err) {
    isPostgresAvailable = false;
    return false;
  }
}
