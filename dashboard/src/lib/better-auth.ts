import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import * as bcrypt from 'bcrypt';
import prisma from '@/lib/postgres';
import { env } from '@/lib/env';
import { SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from '@/services/session.service';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findUserById } from '@/repositories/postgres/user.repository';

const BCRYPT_SALT_ROUNDS = 10;

// A session created within this window of the user's own creation is their very
// first sign-in; skip the locale sync there so the locale they were browsing in
// right before onboarding isn't overwritten by default settings.
const FIRST_SIGN_IN_WINDOW_MS = 60_000;

export const auth = betterAuth({
  appName: 'Betterlytics',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    // Registration goes through registerUserAction (feature-flag gate, terms
    // acceptance, language); the raw sign-up endpoint would bypass all of it.
    disableSignUp: true,
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
  databaseHooks: {
    user: {
      create: {
        // Onboarding side effects for every new user (OAuth signups included).
        // Each block is independent and best-effort, as under next-auth.
        after: async (user) => {
          try {
            await createStarterSubscriptionForUser(user.id);
          } catch (error) {
            console.error('Failed to create initial subscription for new user:', error);
          }

          try {
            await createDefaultUserSettings(user.id);
          } catch (error) {
            console.error('Failed to create initial user settings for new user:', error);
          }

          if (user.email && !user.emailVerified && isFeatureEnabled('enableAccountVerification')) {
            try {
              await sendVerificationEmail({ email: user.email });
            } catch (error) {
              console.error('Failed to send verification email for new user:', error);
            }
          }
        },
      },
    },
    session: {
      create: {
        // Applies the user's saved language when signing in on a browser that
        // doesn't have it yet.
        after: async (session) => {
          try {
            const user = await findUserById(session.userId);
            if (!user?.createdAt) return;
            if (Date.now() - user.createdAt.getTime() < FIRST_SIGN_IN_WINDOW_MS) return;

            const settings = await getUserSettings(session.userId);
            if (settings.language) {
              await setLocaleCookie(settings.language);
            }
          } catch (error) {
            console.error('Failed to sync locale cookie on sign-in:', error);
          }
        },
      },
    },
  },
  plugins: [twoFactor({ issuer: 'Betterlytics' }), nextCookies()],
});

export function getEnabledOAuthProviders(): { google: boolean; github: boolean } {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: Boolean(env.GITHUB_ID && env.GITHUB_SECRET),
  };
}
