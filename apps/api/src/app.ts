import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

import { closeDb, queryClient } from '@gym-tracker/db';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { exerciseRoutes } from './routes/exercises.js';
import { workoutRoutes } from './routes/workouts.js';
import { progressRoutes } from './routes/progress.js';
import { recordRoutes } from './routes/records.js';
import { bodyMeasurementRoutes } from './routes/body-measurements.js';
import { insightRoutes } from './routes/insights.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  const origins = Array.from(new Set([webUrl, 'http://localhost:3000', 'http://localhost:3001']));

  app.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.register(cookie, {
    secret: process.env.BETTER_AUTH_SECRET || 'gym-tracker-local-dev-secret-key-32-bytes-long',
  });

  app.setErrorHandler((error, _request, reply) => {
    const status = (error as any).statusCode && (error as any).statusCode >= 400 ? (error as any).statusCode : 500;
    reply.status(status).send({ error: error.message || 'Internal Server Error' });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: 'Not Found' });
  });

  // Health check route (includes database reachability)
  app.get('/health', async () => {
    try {
      await queryClient`SELECT 1`;
      return { status: 'ok', database: 'up', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'degraded', database: 'down', timestamp: new Date().toISOString() };
    }
  });

  // Register domain routes
  app.register(authRoutes);
  app.register(userRoutes);
  app.register(exerciseRoutes);
  app.register(workoutRoutes);
  app.register(progressRoutes);
  app.register(recordRoutes);
  app.register(bodyMeasurementRoutes);
  app.register(insightRoutes);

  app.addHook('onClose', async () => {
    await closeDb();
  });

  return app;
}
