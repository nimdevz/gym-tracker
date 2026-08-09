import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, users, accounts, sessions, verifications } from '@gym-tracker/db';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'gym-tracker-local-dev-secret-key-32-bytes-long',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    },
  },
  trustedOrigins: [
    process.env.WEB_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
});
