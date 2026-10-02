import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
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

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/gym_tracker';

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL not set, falling back to local Docker PostgreSQL');
}

const isProduction = process.env.NODE_ENV === 'production';

// Pool tuned for a small Fastify service + Better Auth.
// `prepare: false` keeps compatibility with Supabase-style poolers (pgbouncer
// transaction mode) when a production DATABASE_URL is configured later.
export const queryClient = postgres(connectionString, {
  max: Number(process.env.DB_POOL_MAX || 10),
  idle_timeout: Number(process.env.DB_IDLE_TIMEOUT || 30),
  connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT || 10),
  max_lifetime: 60 * 30,
  prepare: false,
  onnotice: () => {},
  ...(isProduction ? { ssl: 'require' as const } : {}),
});

export const db = drizzle(queryClient, { schema });

/**
 * Verify the database is reachable. Retries a few times so the API can start
 * after Postgres during `docker compose up` without manual ordering.
 */
export async function checkDatabaseConnection(retries = 12, delayMs = 1000): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await queryClient`SELECT 1`;
      return;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Database unreachable after ${retries} attempts: ${String(lastError)}`);
}

export async function closeDb(): Promise<void> {
  await queryClient.end({ timeout: 5 });
}

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

export { eq, and, or, desc, asc, ilike, sql, count } from 'drizzle-orm';
