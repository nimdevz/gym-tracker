import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/gym_tracker';

export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export * from './schema.js';
export {
  users,
  accounts,
  sessions,
  verifications,
  exercises,
  workouts,
  workoutExercises,
  sets,
  personalRecords,
  bodyMeasurements,
  userSettings,
} from './schema.js';

export { eq, and, or, desc, asc, ilike, sql } from 'drizzle-orm';
