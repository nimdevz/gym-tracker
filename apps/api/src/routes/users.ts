import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, userSettings, eq } from '@gym-tracker/db';
import { UpdateUserSettingsSchema } from '@gym-tracker/validation';

const DEFAULT_SETTINGS = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  defaultRestTimerSeconds: 90,
} as const;

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/api/users/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      let settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, user.id),
      });

      // Every real user gets a settings row on first visit.
      if (!settings) {
        const [created] = await db
          .insert(userSettings)
          .values({ userId: user.id, ...DEFAULT_SETTINGS })
          .returning();
        settings = created;
      }

      return reply.send({ user, settings });
    } catch (err) {
      request.log.error(err, 'GET /api/users/me failed');
      return reply.status(500).send({ error: 'Failed to load profile' });
    }
  });

  fastify.put('/api/users/settings', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const parseResult = UpdateUserSettingsSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    try {
      const data = parseResult.data;
      const existing = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, user.id),
      });

      if (existing) {
        const [updated] = await db
          .update(userSettings)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(userSettings.userId, user.id))
          .returning();
        return reply.send(updated);
      }

      const [created] = await db
        .insert(userSettings)
        .values({ userId: user.id, ...DEFAULT_SETTINGS, ...data })
        .returning();
      return reply.status(201).send(created);
    } catch (err) {
      request.log.error(err, 'PUT /api/users/settings failed');
      return reply.status(500).send({ error: 'Failed to save settings' });
    }
  });
}
