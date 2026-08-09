import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, bodyMeasurements, eq, and, desc } from '@gym-tracker/db';
import { CreateBodyMeasurementSchema } from '@gym-tracker/validation';
import { memoryStore } from '../services/store.js';
import { BodyMeasurementData } from '@gym-tracker/types';

export async function bodyMeasurementRoutes(fastify: FastifyInstance) {
  // GET /api/body-measurements
  fastify.get('/api/body-measurements', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      const list = await db.query.bodyMeasurements.findMany({
        where: eq(bodyMeasurements.userId, user.id),
        orderBy: [desc(bodyMeasurements.date)],
      });

      if (list.length > 0) return reply.send(list);
    } catch (err) {}

    const memList = memoryStore.bodyMeasurements.filter(b => b.userId === user.id);
    return reply.send(memList);
  });

  // POST /api/body-measurements
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

        if (updated) return reply.send(updated);
      } else {
        const [created] = await db
          .insert(bodyMeasurements)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        if (created) return reply.status(201).send(created);
      }
    } catch (err) {}

    const newMemBm: BodyMeasurementData = {
      id: `bm-${Date.now()}`,
      userId: user.id,
      date: data.date,
      weightKg: data.weightKg ?? null,
      bodyFatPercentage: data.bodyFatPercentage ?? null,
      chestCm: data.chestCm ?? null,
      waistCm: data.waistCm ?? null,
      armsCm: data.armsCm ?? null,
      thighsCm: data.thighsCm ?? null,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
    };

    memoryStore.bodyMeasurements.unshift(newMemBm);
    return reply.status(201).send(newMemBm);
  });

  // DELETE /api/body-measurements/:id
  fastify.delete('/api/body-measurements/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    try {
      await db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id));
    } catch (err) {}

    memoryStore.bodyMeasurements = memoryStore.bodyMeasurements.filter(b => b.id !== id);
    return reply.send({ success: true, message: 'Measurement deleted' });
  });
}
