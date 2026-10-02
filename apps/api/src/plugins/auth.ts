import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '@gym-tracker/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
    };
  }
}

/**
 * Strict authentication: every request must carry a valid Better Auth
 * session cookie for a user that exists in the local database.
 * No demo users, no header-based impersonation, no memory fallbacks.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const cookieHeader = request.headers.cookie || '';
    const session = await auth.api.getSession({
      headers: new Headers(cookieHeader ? { cookie: cookieHeader } : undefined) as any,
    });

    if (session?.user) {
      request.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      };
      return;
    }

    return reply.status(401).send({ error: 'Unauthorized: please sign in' });
  } catch (error) {
    request.log.warn({ err: error }, 'Session lookup failed');
    return reply.status(401).send({ error: 'Unauthorized: please sign in' });
  }
}
