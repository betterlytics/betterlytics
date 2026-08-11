import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import * as bcrypt from 'bcrypt';
import prisma from '@/lib/postgres';
import { env } from '@/lib/env';
import { SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from '@/services/session.service';

const BCRYPT_SALT_ROUNDS = 10;

export const auth = betterAuth({
  appName: 'Betterlytics',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
    // bcrypt is the permanent hasher (not better-auth's scrypt default) so every
    // pre-migration password hash keeps verifying, and the DB stays single-format.
    password: {
      hash: (password) => bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  socialProviders: {
    ...(env.GITHUB_ID && env.GITHUB_SECRET
      ? { github: { clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET } }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {}),
  },
  session: {
    expiresIn: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, input: false },
      onboardingCompletedAt: { type: 'date', required: false, input: false },
      termsAcceptedAt: { type: 'date', required: false, input: false },
      termsAcceptedVersion: { type: 'number', required: false, input: false },
      changelogVersionSeen: { type: 'string', required: false, input: false },
      githubStarPromptState: { type: 'string', required: false, input: false },
    },
  },
  plugins: [twoFactor({ issuer: 'Betterlytics' }), nextCookies()],
});
