import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/postgres';
import { hashPassword, verifyPasswordHash } from '@/lib/password';
import { env } from '@/lib/env';
import { SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from '@/services/session.service';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findUserById, findCredentialAccount } from '@/repositories/postgres/user.repository';
import { PasswordSchema } from '@/entities/auth/password.entities';
import { MAX_EMAIL_LENGTH } from '@/entities/auth/user.entities';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { SUPPORTED_LANGUAGES, type SupportedLanguages } from '@/constants/i18n';
import {
  RESET_TOKEN_EXPIRY_SECONDS,
  resetTokenStoredIdentifier,
  sendPasswordChangedNotification,
  sendResetPasswordEmail,
} from '@/services/auth/passwordReset.service';
import { RESET_TOKEN_PREFIX, deleteUserResetTokens, findResetTokenUserId } from '@/repositories/postgres/resetToken.repository';

// better-auth only enforces password length; these body fields get our full policy.
const PASSWORD_POLICY_FIELDS: Record<string, string> = {
  '/change-password': 'newPassword',
  '/reset-password': 'newPassword',
  '/sign-up/email': 'password',
};

// A session created this soon after the user row is their first sign-in; skip the
// locale sync there so default settings don't overwrite the locale they signed up in.
const FIRST_SIGN_IN_WINDOW_MS = 60_000;

function signupLanguage(body: unknown): SupportedLanguages | undefined {
  const language = (body as { language?: unknown } | undefined)?.language;
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguages) ? (language as SupportedLanguages) : undefined;
}

export const auth = betterAuth({
  appName: 'Betterlytics',
  baseURL: env.AUTH_URL,
  secret: env.AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql', transaction: true }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !isFeatureEnabled('enableRegistration'),
    minPasswordLength: 8,
    maxPasswordLength: 100,
    password: {
      hash: (password) => hashPassword(password),
      verify: ({ hash, password }) => verifyPasswordHash(password, hash),
    },
    resetPasswordTokenExpiresIn: RESET_TOKEN_EXPIRY_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url, token }) => sendResetPasswordEmail({ ...user, name: user.name ?? null }, url, token),
    onPasswordReset: async ({ user }) => {
      await deleteUserResetTokens(user.id);
      await sendPasswordChangedNotification(user.id, user.email, user.name ?? null);
    },
  },
  verification: {
    storeIdentifier: {
      default: 'plain',
      overrides: {
        [RESET_TOKEN_PREFIX]: {
          hash: async (identifier: string) => resetTokenStoredIdentifier(identifier.slice(RESET_TOKEN_PREFIX.length)),
        },
      },
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
      if (ctx.path === '/update-user') {
        throw new APIError('NOT_FOUND');
      }

      // Redeeming a reset for an OAuth-only account would attach a password login to it
      if (ctx.path === '/reset-password') {
        const token = ctx.body?.token;
        if (typeof token === 'string' && token) {
          const userId = await findResetTokenUserId(resetTokenStoredIdentifier(token));
          if (userId && !(await findCredentialAccount(userId))) {
            throw new APIError('BAD_REQUEST', { message: 'Invalid token', code: 'INVALID_TOKEN' });
          }
        }
      }

      if (ctx.path === '/sign-up/email' && String(ctx.body?.email ?? '').length > MAX_EMAIL_LENGTH) {
        throw new APIError('BAD_REQUEST', {
          message: 'Email address is too long',
          code: 'EMAIL_TOO_LONG',
        });
      }

      if (ctx.path === '/sign-up/email' && ctx.body?.acceptedTerms !== true) {
        throw new APIError('BAD_REQUEST', {
          message: 'Terms of service must be accepted',
          code: 'TERMS_NOT_ACCEPTED',
        });
      }

      const passwordField = PASSWORD_POLICY_FIELDS[ctx.path];
      if (passwordField) {
        const strength = PasswordSchema.safeParse(ctx.body?.[passwordField]);
        if (!strength.success) {
          throw new APIError('BAD_REQUEST', {
            message: strength.error.issues[0]?.message ?? 'Password does not meet the requirements',
            code: 'WEAK_PASSWORD',
          });
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const extra: Record<string, unknown> = {};
          if (user.emailVerified) {
            extra.emailVerifiedAt = new Date();
          }
          if (ctx?.path === '/sign-up/email') {
            extra.name = user.name?.trim() || null;
            extra.termsAcceptedAt = new Date();
            extra.termsAcceptedVersion = CURRENT_TERMS_VERSION;
          }
          if (Object.keys(extra).length === 0) return;
          return { data: { ...user, ...extra } };
        },
        after: async (user, ctx) => {
          try {
            await createStarterSubscriptionForUser(user.id);
          } catch (error) {
            console.error('Failed to create initial subscription for new user:', error);
          }

          try {
            const language = ctx?.path === '/sign-up/email' ? signupLanguage(ctx.body) : undefined;
            await createDefaultUserSettings(user.id, language);
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
        after: async (user, ctx) => {
          if (ctx?.path?.startsWith('/two-factor/') && user.email) {
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
          }
        },
      },
    },
    account: {
      update: {
        after: async (account, ctx) => {
          if (ctx?.path === '/change-password') {
            const user = ctx.context.session?.user;
            if (user) {
              await sendPasswordChangedNotification(user.id, user.email, user.name ?? null);
            } else {
              console.error('Skipped password-changed notification: no session user', {
                accountId: account.id,
              });
            }
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
