import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, userSettings, eq } from '@gym-tracker/db';
import { UpdateUserSettingsSchema } from '@gym-tracker/validation';
import { memoryStore } from '../services/store.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/api/users/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      let settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, user.id),
      });

      if (settings) {
        return reply.send({ user, settings });
      }
    } catch (err) {}

    return reply.send({
      user,
      settings: memoryStore.userSettings,
    });
  });

  fastify.put('/api/users/settings', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const parseResult = UpdateUserSettingsSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    try {
      let existing = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, user.id),
      });

      if (existing) {
        const [updated] = await db
          .update(userSettings)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, user.id))
          .returning();
        if (updated) return reply.send(updated);
      }
    } catch (err) {}

    if (data.weightUnit) memoryStore.userSettings.weightUnit = data.weightUnit;
    if (data.distanceUnit) memoryStore.userSettings.distanceUnit = data.distanceUnit;
    if (data.defaultRestTimerSeconds) memoryStore.userSettings.defaultRestTimerSeconds = data.defaultRestTimerSeconds;

    return reply.send(memoryStore.userSettings);
  });
}
