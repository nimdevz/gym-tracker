import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  uuid,
  jsonb,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Better Auth Tables ---
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- Gym Tracker Domain Tables ---

export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  muscleGroup: varchar('muscle_group', { length: 50 }).notNull(),
  secondaryMuscleGroups: jsonb('secondary_muscle_groups').$type<string[]>(),
  equipment: varchar('equipment', { length: 50 }).notNull(),
  exerciseType: varchar('exercise_type', { length: 50 }).default('weight_reps').notNull(),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    muscleGroupIdx: index('exercise_muscle_group_idx').on(table.muscleGroup),
    equipmentIdx: index('exercise_equipment_idx').on(table.equipment),
  };
});

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).default('Gym Workout').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  durationSeconds: integer('duration_seconds'),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('completed').notNull(), // 'in_progress', 'completed', 'abandoned'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('workout_user_id_idx').on(table.userId),
    startTimeIdx: index('workout_start_time_idx').on(table.startTime),
  };
});

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  order: integer('order').default(0).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    workoutIdIdx: index('we_workout_id_idx').on(table.workoutId),
    exerciseIdIdx: index('we_exercise_id_idx').on(table.exerciseId),
  };
});

export const sets = pgTable('sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workoutExerciseId: uuid('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  rir: real('rir'),
  rpe: real('rpe'),
  completed: boolean('completed').default(true).notNull(),
  restDurationSeconds: integer('rest_duration_seconds'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    weIdIdx: index('sets_we_id_idx').on(table.workoutExerciseId),
  };
});

export const personalRecords = pgTable('personal_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  recordType: varchar('record_type', { length: 50 }).notNull(), // 'heaviest_weight', 'max_reps', 'max_estimated_1rm', 'max_set_volume'
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  estimated1RM: real('estimated_1rm').notNull(),
  setId: uuid('set_id').references(() => sets.id, { onDelete: 'set null' }),
  achievedAt: timestamp('achieved_at').defaultNow().notNull(),
}, (table) => {
  return {
    userExerciseIdx: index('pr_user_exercise_idx').on(table.userId, table.exerciseId),
  };
});

export const bodyMeasurements = pgTable('body_measurements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  weightKg: real('weight_kg'),
  bodyFatPercentage: real('body_fat_percentage'),
  chestCm: real('chest_cm'),
  waistCm: real('waist_cm'),
  armsCm: real('arms_cm'),
  thighsCm: real('thighs_cm'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userDateUniqueIdx: uniqueIndex('bm_user_date_idx').on(table.userId, table.date),
  };
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  weightUnit: varchar('weight_unit', { length: 10 }).default('kg').notNull(),
  distanceUnit: varchar('distance_unit', { length: 10 }).default('km').notNull(),
  defaultRestTimerSeconds: integer('default_rest_timer_seconds').default(90).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Relations ---

export const usersRelations = relations(users, ({ many, one }) => ({
  workouts: many(workouts),
  personalRecords: many(personalRecords),
  bodyMeasurements: many(bodyMeasurements),
  settings: one(userSettings),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, { fields: [workouts.userId], references: [users.id] }),
  workoutExercises: many(workoutExercises),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
  personalRecords: many(personalRecords),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutExercises.workoutId], references: [workouts.id] }),
  exercise: one(exercises, { fields: [workoutExercises.exerciseId], references: [exercises.id] }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, { fields: [sets.workoutExerciseId], references: [workoutExercises.id] }),
}));

export const personalRecordsRelations = relations(personalRecords, ({ one }) => ({
  user: one(users, { fields: [personalRecords.userId], references: [users.id] }),
  exercise: one(exercises, { fields: [personalRecords.exerciseId], references: [exercises.id] }),
  set: one(sets, { fields: [personalRecords.setId], references: [sets.id] }),
}));
