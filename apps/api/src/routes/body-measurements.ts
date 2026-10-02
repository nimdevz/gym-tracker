import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, bodyMeasurements, eq, and, desc } from '@gym-tracker/db';
import { CreateBodyMeasurementSchema } from '@gym-tracker/validation';

export async function bodyMeasurementRoutes(fastify: FastifyInstance) {
  // GET /api/body-measurements — this user's rows only, newest first
  fastify.get('/api/body-measurements', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    try {
      const list = await db.query.bodyMeasurements.findMany({
        where: eq(bodyMeasurements.userId, user.id),
        orderBy: [desc(bodyMeasurements.date)],
      });
      return reply.send(list);
    } catch (err) {
      request.log.error(err, 'GET /api/body-measurements failed');
      return reply.status(500).send({ error: 'Failed to load measurements' });
    }
  });

  // POST /api/body-measurements — upsert on (userId, date)
  fastify.post('/api/body-measurements', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const parseResult = CreateBodyMeasurementSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    try {
      const existing = await db.query.bodyMeasurements.findFirst({
        where: and(eq(bodyMeasurements.userId, user.id), eq(bodyMeasurements.date, data.date)),
      });

      if (existing) {
        const [updated] = await db
          .update(bodyMeasurements)
          .set({ ...data })
          .where(eq(bodyMeasurements.id, existing.id))
          .returning();
        return reply.send(updated);
      }

      const [created] = await db
        .insert(bodyMeasurements)
        .values({ userId: user.id, ...data })
        .returning();
      return reply.status(201).send(created);
    } catch (err: any) {
      if (err?.code === '23505') {
        return reply.status(409).send({ error: 'A measurement for this date already exists' });
      }
      request.log.error(err, 'POST /api/body-measurements failed');
      return reply.status(500).send({ error: 'Failed to save measurement' });
    }
  });

  // DELETE /api/body-measurements/:id (owner only)
  fastify.delete('/api/body-measurements/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    try {
      const existing = await db.query.bodyMeasurements.findFirst({
        where: and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, user.id)),
      });
      if (!existing) return reply.status(404).send({ error: 'Measurement not found' });
      await db.delete(bodyMeasurements).where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, user.id)));
      return reply.send({ success: true, message: 'Measurement deleted' });
    } catch (err) {
      request.log.error(err, 'DELETE /api/body-measurements/:id failed');
      return reply.status(500).send({ error: 'Failed to delete measurement' });
    }
  });
}
