import { buildApp } from './app.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port, host });
    console.log(`🚀 Fastify REST API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
