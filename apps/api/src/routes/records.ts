import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.js';
import { db, personalRecords, eq, desc } from '@gym-tracker/db';

export async function recordRoutes(fastify: FastifyInstance) {
  fastify.get('/api/records', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    try {
      const list = await db.query.personalRecords.findMany({
        where: eq(personalRecords.userId, user.id),
        orderBy: [desc(personalRecords.achievedAt)],
        with: { exercise: true },
      });

      return reply.send(
        list.map((pr) => ({
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
        })),
      );
    } catch (err) {
      request.log.error(err, 'GET /api/records failed');
      return reply.status(500).send({ error: 'Failed to load records' });
    }
  });
}
