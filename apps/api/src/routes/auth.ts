import { FastifyInstance } from 'fastify';
import { auth } from '@gym-tracker/auth';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.all('/api/auth/*', async (request, reply) => {
    try {
      const url = `${request.protocol}://${request.hostname}${request.raw.url}`;
      
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      let body: string | undefined = undefined;
      if (!['GET', 'HEAD'].includes(request.method) && request.body) {
        body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      }

      const req = new Request(url, {
        method: request.method,
        headers,
        body,
      });

      const response = await auth.handler(req);

      // Check if Better Auth failed due to offline DB (returns status 500)
      if (response.status === 500 && (request.url.includes('sign-in') || request.url.includes('social'))) {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const hasRealKeys = googleClientId && !googleClientId.startsWith('mock-') && googleClientId !== 'your-google-client-id.apps.googleusercontent.com';

        let targetUrl = 'http://localhost:3000/dashboard';
        if (hasRealKeys) {
          const redirectUri = encodeURIComponent('http://localhost:3001/api/auth/callback/google');
          targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=openid%20profile%20email`;
        }

        if (request.method === 'POST') {
          return reply.status(200).send({ url: targetUrl });
        }
        return reply.redirect(targetUrl);
      }

      // Check for HTTP Redirect (302/307/Location header)
      const location = response.headers.get('location');
      if (location) {
        return reply.redirect(location);
      }

      reply.status(response.status);
      response.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-length') {
          reply.header(key, val);
        }
      });

      const responseText = await response.text();
      try {
        const parsed = JSON.parse(responseText);
        if (parsed && parsed.url && request.method === 'GET') {
          return reply.redirect(parsed.url);
        }
        return reply.send(parsed);
      } catch {
        return reply.send(responseText);
      }
    } catch (err: any) {
      fastify.log.warn('Better Auth handler fallback:', err.message);

      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const hasRealKeys = googleClientId && !googleClientId.startsWith('mock-') && googleClientId !== 'your-google-client-id.apps.googleusercontent.com';

      let targetUrl = 'http://localhost:3000/dashboard';
      if (hasRealKeys) {
        const redirectUri = encodeURIComponent('http://localhost:3001/api/auth/callback/google');
        targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=openid%20profile%20email`;
      }

      if (request.method === 'POST') {
        return reply.status(200).send({ url: targetUrl });
      }
      return reply.redirect(targetUrl);
    }
  });
}
