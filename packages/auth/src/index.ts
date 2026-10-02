import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, users, accounts, sessions, verifications } from '@gym-tracker/db';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function loadRootEnv(): void {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  dotenv.config();
}
loadRootEnv();

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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
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
