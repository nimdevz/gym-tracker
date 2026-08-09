import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

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

  app.register(cors, {
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'cookie'],
  });

  app.register(cookie);

  // Health check route
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
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

  return app;
}
