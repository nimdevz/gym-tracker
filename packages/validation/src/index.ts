import { z } from 'zod';

export const MuscleGroupEnum = z.enum([
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
  'full_body',
]);

export const EquipmentEnum = z.enum([
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'other',
]);

export const ExerciseTypeEnum = z.enum([
  'weight_reps',
  'bodyweight_reps',
  'time_duration',
]);

export const CreateExerciseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  muscleGroup: MuscleGroupEnum,
  secondaryMuscleGroups: z.array(MuscleGroupEnum).optional(),
  equipment: EquipmentEnum,
  exerciseType: ExerciseTypeEnum.default('weight_reps'),
  instructions: z.string().optional(),
});

export const CreateSetSchema = z.object({
  setNumber: z.number().int().min(1),
  weight: z.number().min(0, 'Weight must be non-negative'),
  reps: z.number().int().min(0, 'Reps must be non-negative'),
  rir: z.number().min(0).max(10).optional().nullable(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  completed: z.boolean().default(true),
  restDurationSeconds: z.number().int().min(0).optional().nullable(),
});

export const UpdateSetSchema = CreateSetSchema.partial().extend({
  id: z.string().optional(),
});

export const AddWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  order: z.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
  sets: z.array(CreateSetSchema).optional(),
});

export const StartWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').default('Gym Workout'),
  notes: z.string().optional().nullable(),
});

export const UpdateWorkoutSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
});

export const CreateBodyMeasurementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  weightKg: z.number().positive().optional().nullable(),
  bodyFatPercentage: z.number().min(1).max(70).optional().nullable(),
  chestCm: z.number().positive().optional().nullable(),
  waistCm: z.number().positive().optional().nullable(),
  armsCm: z.number().positive().optional().nullable(),
  thighsCm: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateUserSettingsSchema = z.object({
  weightUnit: z.enum(['kg', 'lbs']).optional(),
  distanceUnit: z.enum(['km', 'miles']).optional(),
  defaultRestTimerSeconds: z.number().int().min(10).max(600).optional(),
});

export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;
export type CreateSetInput = z.infer<typeof CreateSetSchema>;
export type AddWorkoutExerciseInput = z.infer<typeof AddWorkoutExerciseSchema>;
export type StartWorkoutInput = z.infer<typeof StartWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;
export type CreateBodyMeasurementInput = z.infer<typeof CreateBodyMeasurementSchema>;
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;
