import { db, queryClient, exercises } from './index.js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function loadRootEnv(): void {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  dotenv.config();
}
loadRootEnv();

const initialExercises = [
  // Chest
  {
    name: 'Barbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Lie flat on the bench, grip the barbell slightly wider than shoulder-width, lower to mid-chest, and press explosively upwards.',
  },
  {
    name: 'Incline Barbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Set bench to 30-45 degrees angle. Lower bar to upper chest and press vertically.',
  },
  {
    name: 'Dumbbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Lie flat on bench holding dumbbells above chest. Lower until elbows reach 90 degrees and press back together.',
  },
  {
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Incline bench at 30 degrees. Press dumbbells overhead emphasizing upper chest activation.',
  },
  {
    name: 'Cable Fly',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Stand between dual cable towers, bring handles together in front of chest in a hugging motion.',
  },
  {
    name: 'Pec Deck',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders'],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Sit in machine with elbows at 90 degrees. Squeeze handles together focusing on pectoral contraction.',
  },

  // Back
  {
    name: 'Deadlift',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['legs', 'core'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand with feet hip-width under bar. Hinge hips back, grip bar, keep flat back, and drive through heels to lock out hips.',
  },
  {
    name: 'Barbell Row',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Hinge forward at 45 degrees, pull barbell towards lower ribcage, squeezing lats at the top.',
  },
  {
    name: 'Seated Cable Row',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Sit facing cable machine, pull handle to abdomen while keeping chest high and elbows close to torso.',
  },
  {
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Sit down, grip wide bar, pull bar down towards upper chest while retracting shoulder blades.',
  },
  {
    name: 'Pull-Up',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'bodyweight',
    exerciseType: 'bodyweight_reps',
    instructions: 'Overhand grip on pull-up bar wider than shoulders. Pull chest up to bar.',
  },
  {
    name: 'Chin-Up',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'bodyweight',
    exerciseType: 'bodyweight_reps',
    instructions: 'Underhand shoulder-width grip. Pull chin over bar with strong bicep involvement.',
  },
  {
    name: 'Single Arm Dumbbell Row',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Place one knee and hand on flat bench. Pull dumbbell up towards hip with the opposite arm.',
  },

  // Shoulders
  {
    name: 'Overhead Press',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['arms', 'core'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand tall with barbell on front shoulders. Press weight straight overhead to full lockout.',
  },
  {
    name: 'Dumbbell Shoulder Press',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['arms'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Seated or standing, hold dumbbells at ear level and press upward overhead.',
  },
  {
    name: 'Lateral Raise',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Hold dumbbells at sides with slight elbow bend. Raise arms out sideways until parallel to floor.',
  },
  {
    name: 'Rear Delt Fly',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['back'],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Bend forward at waist or use pec deck backwards. Raise dumbbells out to sides targeting posterior deltoids.',
  },
  {
    name: 'Face Pull',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['back'],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Attach rope handle to high cable. Pull handles toward face while externally rotating shoulders.',
  },

  // Legs
  {
    name: 'Barbell Back Squat',
    muscleGroup: 'legs',
    secondaryMuscleGroups: ['core', 'back'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Rest barbell on upper traps. Squat down until thighs are parallel to ground, keep knees aligned, drive up.',
  },
  {
    name: 'Front Squat',
    muscleGroup: 'legs',
    secondaryMuscleGroups: ['core'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Rest barbell on front deltoids with clean or cross-arm grip. Squat deeply keeping torso upright.',
  },
  {
    name: 'Leg Press',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Place feet shoulder-width on footplate. Release safety, lower sled smoothly to 90 degrees, press back up.',
  },
  {
    name: 'Romanian Deadlift',
    muscleGroup: 'legs',
    secondaryMuscleGroups: ['back'],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand holding barbell. Hinge hips back with slight knee bend until deep hamstring stretch is felt.',
  },
  {
    name: 'Leg Curl',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Lie or sit in leg curl machine. Flex knees to curl pad toward glutes.',
  },
  {
    name: 'Leg Extension',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Sit in machine with pad over lower shins. Extend legs upward to squeeze quadriceps.',
  },
  {
    name: 'Bulgarian Split Squat',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Place rear foot elevated on bench. Descend on front leg until rear knee touches ground.',
  },
  {
    name: 'Walking Lunges',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Step forward landing smoothly, lowering rear knee to floor, then step through with back leg.',
  },
  {
    name: 'Calf Raise',
    muscleGroup: 'legs',
    secondaryMuscleGroups: [],
    equipment: 'machine',
    exerciseType: 'weight_reps',
    instructions: 'Stand on edge of step or calf block. Lower heels for stretch, press onto toes to contract calves.',
  },

  // Arms
  {
    name: 'Barbell Curl',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Underhand grip on barbell. Keep upper arms stationary and curl bar towards chest.',
  },
  {
    name: 'Dumbbell Curl',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Stand holding dumbbells. Supinate wrist as you curl weights upward.',
  },
  {
    name: 'Hammer Curl',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Neutral grip (palms facing each other). Curl dumbbells focusing on brachialis and forearm.',
  },
  {
    name: 'Preacher Curl',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Rest upper arms flat on preacher bench pad. Lower EZ bar with control and curl to peak contraction.',
  },
  {
    name: 'Tricep Pushdown',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'cable',
    exerciseType: 'weight_reps',
    instructions: 'Attach bar or rope to high pulley. Keep elbows tucked at sides and push bar down to full extension.',
  },
  {
    name: 'Skull Crusher',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'barbell',
    exerciseType: 'weight_reps',
    instructions: 'Lie on bench with EZ bar overhead. Bend elbows to lower bar toward forehead, then extend arms back up.',
  },
  {
    name: 'Overhead Tricep Extension',
    muscleGroup: 'arms',
    secondaryMuscleGroups: [],
    equipment: 'dumbbell',
    exerciseType: 'weight_reps',
    instructions: 'Hold dumbbell overhead with both hands. Lower behind head by flexing elbows, then press overhead.',
  },
  {
    name: 'Dips',
    muscleGroup: 'arms',
    secondaryMuscleGroups: ['chest', 'shoulders'],
    equipment: 'bodyweight',
    exerciseType: 'bodyweight_reps',
    instructions: 'Hold parallel bars. Lower body by bending arms to 90 degrees, then push back up to lockout.',
  },
];

async function seed() {
  console.log('Seeding initial exercise library...');
  try {
    for (const ex of initialExercises) {
      await db
        .insert(exercises)
        .values({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          secondaryMuscleGroups: ex.secondaryMuscleGroups,
          equipment: ex.equipment,
          exerciseType: ex.exerciseType,
          instructions: ex.instructions,
        })
        .onConflictDoNothing({ target: exercises.name });
    }
    console.log(`Successfully seeded ${initialExercises.length} exercises!`);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

seed();
