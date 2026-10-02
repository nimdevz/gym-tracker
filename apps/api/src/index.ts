import { buildApp } from './app.js';
import { checkDatabaseConnection, closeDb } from '@gym-tracker/db';
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

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

const app = buildApp();

async function start() {
  try {
    await checkDatabaseConnection();
    console.log('✅ Database connection verified');
    await app.listen({ port, host });
    console.log(`🚀 API server running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  try {
    await app.close();
  } catch {}
  try {
    await closeDb();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

start();
