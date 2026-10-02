import { FastifyInstance } from 'fastify';
import { auth } from '@gym-tracker/auth';

const HOP_BY_HOP = new Set(['host', 'content-length', 'connection', 'transfer-encoding']);

export async function authRoutes(fastify: FastifyInstance) {
  fastify.all('/api/auth/*', async (request, reply) => {
    try {
      const proto = (request.headers['x-forwarded-proto'] as string) || request.protocol;
      const url = `${proto}://${request.hostname}${request.raw.url}`;

      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }

      const contentType = request.headers['content-type'] || '';
      let body: string | undefined = undefined;
      if (!['GET', 'HEAD'].includes(request.method) && request.body !== undefined) {
        body =
          typeof request.body === 'string'
            ? request.body
            : contentType.includes('application/x-www-form-urlencoded')
              ? new URLSearchParams(request.body as Record<string, string>).toString()
              : JSON.stringify(request.body);
        if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      }

      const req = new Request(url, {
        method: request.method,
        headers,
        body,
      });

      const response = await auth.handler(req);

      // Better Auth returns OAuth URL via Location header (often 200 + empty body for POST).
      // Browsers/fetch clients expect JSON {url} on POST, redirect on GET.
      const location = response.headers.get('location');
      if (location) {
        const setCookies = response.headers.getSetCookie?.() ?? [];
        if (setCookies.length > 0) {
          void reply.raw.setHeader('set-cookie', setCookies);
        }
        if (request.method === 'POST') {
          reply.status(200);
          response.headers.forEach((val, key) => {
            const lower = key.toLowerCase();
            if (lower === 'set-cookie' || lower === 'location' || lower === 'content-length' || lower === 'transfer-encoding') return;
            reply.header(key, val);
          });
          return reply.send({ url: location });
        }
        reply.status(response.status);
        response.headers.forEach((val, key) => {
          const lower = key.toLowerCase();
          if (lower === 'location' || lower === 'content-length' || lower === 'transfer-encoding') return;
          if (lower === 'set-cookie') return; // already set above
          reply.header(key, val);
        });
        return reply.redirect(location);
      }

      reply.status(response.status);
      const setCookies = response.headers.getSetCookie?.() ?? [];
      if (setCookies.length > 0) {
        void reply.raw.setHeader('set-cookie', setCookies);
      }
      response.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (lower === 'set-cookie' || lower === 'content-length' || lower === 'transfer-encoding') return;
        reply.header(key, val);
      });

      const responseText = await response.text();
      if (!responseText) return reply.send();
      try {
        return reply.send(JSON.parse(responseText));
      } catch {
        return reply.send(responseText);
      }
    } catch (err: any) {
      request.log.error(err, 'Better Auth handler failed');
      return reply.status(500).send({ error: 'Authentication service unavailable. Check GOOGLE_CLIENT_ID/SECRET and DATABASE_URL.' });
    }
  });
}
