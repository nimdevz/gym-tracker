import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { FastifyInstance } from 'fastify';
import { db, users, sessions, workouts, eq } from '@gym-tracker/db';

/**
 * End-to-end tests with a REAL user in the local database:
 * sign-up via email/password (Better Auth), then use the real session
 * cookie for all subsequent requests. No demo users, no header bypass.
 */
describe('Fastify REST API Integration Tests', () => {
  let app: FastifyInstance;
  let sessionCookie = '';
  let userId = '';
  const testEmail = `test-athlete-${Date.now()}@example.com`;

  function authHeaders(extra: Record<string, string> = {}) {
    return { cookie: sessionCookie, ...extra };
  }

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Test Athlete', email: testEmail, password: 'TestPassword123!' },
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
    });
    expect(signUp.statusCode).toBe(200);

    const rawCookies = signUp.headers['set-cookie'];
    const cookieList = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
    const sessionPart = cookieList
      .map((c) => String(c).split(';')[0])
      .find((c) => c.startsWith('better-auth.session_token='));
    expect(sessionPart).toBeDefined();
    sessionCookie = sessionPart!;

    const [row] = await db.select().from(users).where(eq(users.email, testEmail));
    expect(row).toBeDefined();
    userId = row.id;
  });

  afterAll(async () => {
    if (userId) {
      await db.delete(workouts).where(eq(workouts.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    await app.close();
  });

  it('GET /health should return 200 OK', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
  });

  it('protected routes should 401 without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/exercises' });
    expect(response.statusCode).toBe(401);
  });

  it('GET /api/exercises should work with a real user session', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/exercises',
      headers: authHeaders(),
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(response.payload))).toBe(true);
  });

  it('GET /api/users/me should auto-provision settings for the user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      headers: authHeaders(),
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.user.id).toBe(userId);
    expect(body.settings.userId).toBe(userId);
  });

  it('workouts should be isolated per user', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/workouts',
      payload: { name: 'Isolation Check' },
      headers: authHeaders({ 'content-type': 'application/json' }),
    });
    expect([200, 201]).toContain(create.statusCode);
    const created = JSON.parse(create.payload);
    expect(created.userId).toBe(userId);

    const owned = await app.inject({
      method: 'GET',
      url: `/api/workouts/${created.id}`,
      headers: authHeaders(),
    });
    expect(owned.statusCode).toBe(200);

    // Unauthenticated requests get 401, never another user's data
    const anon = await app.inject({ method: 'GET', url: `/api/workouts/${created.id}` });
    expect(anon.statusCode).toBe(401);

    await app.inject({
      method: 'DELETE',
      url: `/api/workouts/${created.id}`,
      headers: authHeaders(),
    });
  });

  it('POST /api/auth/sign-in/social should generate Google OAuth authorization URL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/social',
      payload: {
        provider: 'google',
        callbackURL: 'http://localhost:3000/dashboard',
      },
      headers: {
        'content-type': 'application/json',
        'origin': 'http://localhost:3000',
      },
    });

    // Better Auth may respond 200 {url} or 302 redirect depending on version
    expect([200, 302]).toContain(response.statusCode);
    if (response.statusCode === 302) {
      expect(response.headers.location || '').toContain('google.com');
      return;
    }
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('url');
    expect(body.url).toContain('google.com');
  });
});
