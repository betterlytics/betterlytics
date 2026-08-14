import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import * as bcrypt from 'bcrypt';
import prisma from '@/lib/postgres';
import { env } from '@/lib/env';
import { SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from '@/services/session.service';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findUserById } from '@/repositories/postgres/user.repository';

const BCRYPT_SALT_ROUNDS = 10;

// A session created this soon after the user row is their first sign-in; skip the
// locale sync there so default settings don't overwrite the locale they signed up in.
const FIRST_SIGN_IN_WINDOW_MS = 60_000;

export const auth = betterAuth({
  appName: 'Betterlytics',
  baseURL: env.AUTH_URL,
  secret: env.AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    // Registration goes through registerUserAction
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
    // bcrypt so pre-migration hashes keep verifying and the DB stays single-format.
    password: {
      hash: (password) => bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  socialProviders: {
    ...(env.GITHUB_ID && env.GITHUB_SECRET
      ? {
          github: {
            clientId: env.GITHUB_ID,
            clientSecret: env.GITHUB_SECRET,
            disableSignUp: !isFeatureEnabled('enableRegistration'),
          },
        }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            disableSignUp: !isFeatureEnabled('enableRegistration'),
          },
        }
      : {}),
  },
  session: {
    expiresIn: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, input: false },
      emailVerifiedAt: { type: 'date', required: false, input: false },
      onboardingCompletedAt: { type: 'date', required: false, input: false },
      termsAcceptedAt: { type: 'date', required: false, input: false },
      termsAcceptedVersion: { type: 'number', required: false, input: false },
      changelogVersionSeen: { type: 'string', required: false, input: false },
      githubStarPromptState: { type: 'string', required: false, input: false },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Account mutations run through our server actions
      if (
        ctx.path === '/change-password' ||
        ctx.path === '/request-password-reset' ||
        ctx.path.startsWith('/reset-password') ||
        ctx.path === '/update-user'
      ) {
        throw new APIError('NOT_FOUND');
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Only runs for Oauth because email/password users are created through our own actions
        before: async (user) => {
          if (!user.emailVerified) return;
          return { data: { ...user, emailVerifiedAt: new Date() } };
        },
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
      update: {
        // Currently only twoFactorChange runs via this update hook, hence the path prefix check
        after: async (user, ctx) => {
          if (!ctx?.path?.startsWith('/two-factor/')) return;
          if (!user.email) return;

          const enabled = Boolean((user as { twoFactorEnabled?: boolean }).twoFactorEnabled);
          const type = enabled ? ('two-factor-enabled' as const) : ('two-factor-disabled' as const);
          try {
            await enqueueEmail({
              type,
              recipientKey: createUserRecipientKey(user.id),
              campaignKey: `${type}:${new Date().toISOString()}`,
              data: { to: user.email, userName: user.name ?? null },
            });
          } catch (error) {
            console.error('Failed to enqueue 2FA change notification:', error);
          }
        },
      },
    },
    session: {
      create: {
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
