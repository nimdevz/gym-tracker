import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
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
  // Migrations must run on a direct connection (Neon PgBouncer pooled
  // connections don't support session-level migration operations).
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgrespassword@localhost:5432/gym_tracker';

async function runMigrations() {
  console.log('Running database migrations...');
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    const candidates = [
      path.resolve(process.cwd(), 'drizzle'),
      path.resolve(process.cwd(), 'packages/db/drizzle'),
    ];
    const migrationsFolder = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
