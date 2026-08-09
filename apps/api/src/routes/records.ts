import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, personalRecords, eq, desc } from '@gym-tracker/db';
import { memoryStore, isDbAvailable } from '../services/store.js';

export async function recordRoutes(fastify: FastifyInstance) {
  fastify.get('/api/records', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    if (await isDbAvailable()) {
      try {
        const list = await db.query.personalRecords.findMany({
          where: eq(personalRecords.userId, user.id),
          orderBy: [desc(personalRecords.achievedAt)],
          with: {
            exercise: true,
          },
        });

        if (list.length > 0) {
          const formatted = list.map(pr => ({
            id: pr.id,
            userId: pr.userId,
            exerciseId: pr.exerciseId,
            exerciseName: pr.exercise.name,
            recordType: pr.recordType,
            weight: pr.weight,
            reps: pr.reps,
            estimated1RM: pr.estimated1RM,
            setId: pr.setId,
            achievedAt: pr.achievedAt.toISOString(),
          }));

          return reply.send(formatted);
        }
      } catch (err) {}
    }

    const memList = memoryStore.personalRecords.filter(p => p.userId === user.id);
    return reply.send(memList);
  });
}
