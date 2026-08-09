import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { FastifyInstance } from 'fastify';

describe('Fastify REST API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return 200 OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
  });

  it('GET /api/exercises should require authentication or dev user header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/exercises',
      headers: {
        'x-user-id': 'dev-user-001',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(response.payload))).toBe(true);
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

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('url');
    expect(body.url).toContain('google.com');
  });
});
