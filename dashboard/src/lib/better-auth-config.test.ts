import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { auth, getEnabledOAuthProviders } from '@/lib/better-auth';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { enqueueEmail } from '@/services/email/email.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findUserById, findCredentialAccount } from '@/repositories/postgres/user.repository';
import { makeUser, hashPassword } from '@/test/auth-fixtures';
import { resetTokenStoredIdentifier } from '@/services/auth/passwordReset.service';
import { deleteUserResetTokens, findResetTokenUserId } from '@/repositories/postgres/resetToken.repository';

vi.mock('@/lib/env', () => ({
  env: {
    AUTH_URL: 'http://localhost:3000',
    AUTH_SECRET: 'test-auth-secret',
    PUBLIC_BASE_URL: 'http://localhost:3000',
    GITHUB_ID: '',
    GITHUB_SECRET: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
  },
}));
vi.mock('@/lib/postgres', () => ({
  default: {},
}));
vi.mock('@/repositories/postgres/session.repository', () => ({
  deleteOtherUserSessions: vi.fn(),
  countUserSessions: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserById: vi.fn(),
  findCredentialAccount: vi.fn(),
}));
vi.mock('@/repositories/postgres/resetToken.repository', () => ({
  RESET_TOKEN_PREFIX: 'reset-password:',
  findResetTokenUserId: vi.fn(),
  deleteUserResetTokens: vi.fn(),
}));
vi.mock('@/services/account/userSettings.service', () => ({
  createDefaultUserSettings: vi.fn(),
  getUserSettings: vi.fn(),
}));
vi.mock('@/services/billing/subscription.service', () => ({
  createStarterSubscriptionForUser: vi.fn(),
}));
vi.mock('@/services/account/verification.service', () => ({
  sendVerificationEmail: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));
vi.mock('@/services/email/recipient-key.service', () => ({
  createUserRecipientKey: vi.fn((userId: string) => `user:${userId}`),
}));
vi.mock('@/constants/cookies', () => ({
  setLocaleCookie: vi.fn(),
}));
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('password hashing (bcrypt compatibility)', () => {
  const PASSWORD = 'Correct-horse-1';

  it('verifies a pre-migration bcrypt hash', async () => {
    const legacyHash = hashPassword(PASSWORD);

    expect(await auth.options.emailAndPassword!.password!.verify!({ hash: legacyHash, password: PASSWORD })).toBe(
      true,
    );
    expect(
      await auth.options.emailAndPassword!.password!.verify!({ hash: legacyHash, password: 'Wrong-password-1' }),
    ).toBe(false);
  });

  it('hashes new passwords with bcrypt (single format in the database, forever)', async () => {
    const hash = await auth.options.emailAndPassword!.password!.hash!(PASSWORD);

    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare(PASSWORD, hash)).toBe(true);
  });

  it('keeps the documented password length policy', () => {
    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 100,
    });
  });
});

describe('session configuration', () => {
  it('uses the 30-day/24-hour lifetimes pinned by session.service', () => {
    expect(auth.options.session).toMatchObject({
      expiresIn: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    });
  });
});

describe('plugins and providers', () => {
  it('registers the twoFactor plugin', () => {
    expect(auth.options.plugins!.some((p) => p.id === 'two-factor')).toBe(true);
  });

  it('is branded for authenticator apps', () => {
    expect(auth.options.appName).toBe('Betterlytics');
  });

  it('reports OAuth providers as disabled when their env vars are missing', () => {
    expect(getEnabledOAuthProviders()).toEqual({ google: false, github: false });
    expect(auth.options.socialProviders).toEqual({});
  });

  it('carries the custom identity fields on the user model', () => {
    expect(Object.keys(auth.options.user!.additionalFields!)).toEqual(
      expect.arrayContaining([
        'role',
        'onboardingCompletedAt',
        'termsAcceptedAt',
        'termsAcceptedVersion',
        'changelogVersionSeen',
        'githubStarPromptState',
      ]),
    );
  });
});

describe('user create hook (onboarding side effects)', () => {
  const hookUser = { ...makeUser(), emailVerified: false } as never;

  function runCreateHook(user = hookUser) {
    return auth.options.databaseHooks!.user!.create!.after!(user);
  }

  it('provisions a starter subscription and default settings for new users', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    await runCreateHook();

    expect(createStarterSubscriptionForUser).toHaveBeenCalledWith('user-1');
    expect(createDefaultUserSettings).toHaveBeenCalledWith('user-1');
  });

  it('sends a verification email to new unverified users when verification is enabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);

    await runCreateHook();

    expect(sendVerificationEmail).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('skips the verification email when the provider already verified the address', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);

    await runCreateHook({ ...makeUser(), emailVerified: true } as never);

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('swallows side-effect failures (user creation must not fail)', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    vi.mocked(createStarterSubscriptionForUser).mockRejectedValue(new Error('db down'));

    await expect(runCreateHook()).resolves.toBeUndefined();
    expect(createDefaultUserSettings).toHaveBeenCalled();
  });
});

describe('session create hook (locale sync)', () => {
  const SESSION = { userId: 'user-1' } as never;

  function runSessionHook() {
    return auth.options.databaseHooks!.session!.create!.after!(SESSION);
  }

  it('applies the saved language on sign-in for existing users', async () => {
    vi.mocked(findUserById).mockResolvedValue(makeUser({ createdAt: new Date(Date.now() - 3_600_000) }));
    vi.mocked(getUserSettings).mockResolvedValue({ language: 'da' } as never);

    await runSessionHook();

    expect(setLocaleCookie).toHaveBeenCalledWith('da');
  });

  it("leaves the locale alone on a brand-new user's first sign-in", async () => {
    vi.mocked(findUserById).mockResolvedValue(makeUser({ createdAt: new Date() }));

    await runSessionHook();

    expect(getUserSettings).not.toHaveBeenCalled();
    expect(setLocaleCookie).not.toHaveBeenCalled();
  });

  it('does not fail session creation when the locale sync throws', async () => {
    vi.mocked(findUserById).mockResolvedValue(makeUser({ createdAt: new Date(Date.now() - 3_600_000) }));
    vi.mocked(getUserSettings).mockRejectedValue(new Error('db down'));

    await expect(runSessionHook()).resolves.toBeUndefined();
  });
});

describe('before hook (closed better-auth endpoints)', () => {
  type BeforeHook = (ctx: { path: string; body?: unknown }) => Promise<unknown>;
  const runBeforeHook = (path: string, body: unknown = {}) =>
    (auth.options.hooks!.before as unknown as BeforeHook)({ path, body });

  it('/update-user returns 404 (profile mutations run through our server actions)', async () => {
    await expect(runBeforeHook('/update-user')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('leaves the live endpoints alone', async () => {
    await expect(runBeforeHook('/sign-in/email', { email: 'user@example.com' })).resolves.toBeUndefined();
    await expect(runBeforeHook('/change-password', { newPassword: 'Correct-horse-1' })).resolves.toBeUndefined();
    await expect(
      runBeforeHook('/request-password-reset', { email: 'pass-through@example.com' }),
    ).resolves.toBeUndefined();
    await expect(runBeforeHook('/reset-password', { newPassword: 'Correct-horse-1' })).resolves.toBeUndefined();
  });

  describe('reset redemption guard (OAuth-only accounts)', () => {
    const body = { token: 'raw-token', newPassword: 'Correct-horse-1' };

    it('rejects redemption when the token belongs to an account without a password', async () => {
      vi.mocked(findResetTokenUserId).mockResolvedValue('user-1');
      vi.mocked(findCredentialAccount).mockResolvedValue(null);

      await expect(runBeforeHook('/reset-password', body)).rejects.toMatchObject({
        statusCode: 400,
        body: { code: 'INVALID_TOKEN' },
      });
      expect(findResetTokenUserId).toHaveBeenCalledWith(resetTokenStoredIdentifier('raw-token'));
    });

    it('lets credential accounts and unknown tokens through to better-auth', async () => {
      vi.mocked(findResetTokenUserId).mockResolvedValue('user-1');
      vi.mocked(findCredentialAccount).mockResolvedValue({ id: 'account-1' } as never);
      await expect(runBeforeHook('/reset-password', body)).resolves.toBeUndefined();

      vi.mocked(findResetTokenUserId).mockResolvedValue(null);
      await expect(runBeforeHook('/reset-password', body)).resolves.toBeUndefined();
    });
  });

  it.each([
    ['/change-password', { newPassword: 'no-uppercase-1' }],
    ['/sign-up/email', { password: 'no-uppercase-1' }],
    ['/reset-password', { newPassword: 'no-uppercase-1' }],
  ])('rejects weak passwords on %s when the client-side schema is bypassed', async (path, body) => {
    await expect(runBeforeHook(path, body)).rejects.toMatchObject({
      statusCode: 400,
      body: { code: 'WEAK_PASSWORD' },
    });
  });
});

describe('password reset (built-in endpoints)', () => {
  const RESET_USER = makeUser() as never;

  it('keeps the 1-hour token expiry and revokes all sessions after a reset', () => {
    expect(auth.options.emailAndPassword).toMatchObject({
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
    });
  });

  it('sendResetPassword prunes older tokens and enqueues the emailed better-auth url', async () => {
    vi.mocked(findCredentialAccount).mockResolvedValue({ id: 'account-1' });

    await auth.options.emailAndPassword!.sendResetPassword!({
      user: RESET_USER,
      url: 'http://localhost:3000/api/auth/reset-password/tok-1?callbackURL=%2Freset-password',
      token: 'tok-1',
    });

    expect(deleteUserResetTokens).toHaveBeenCalledWith('user-1', resetTokenStoredIdentifier('tok-1'));
    expect(enqueueEmail).toHaveBeenCalledWith({
      type: 'reset-password',
      recipientKey: expect.any(String),
      campaignKey: resetTokenStoredIdentifier('tok-1'),
      data: {
        to: 'user@example.com',
        userName: 'Test User',
        resetUrl: 'http://localhost:3000/api/auth/reset-password/tok-1?callbackURL=%2Freset-password',
        expirationTime: '1 hour',
      },
    });
  });

  it('stores reset tokens hashed at rest but keeps the identifier prefix', async () => {
    const overrides = (
      auth.options.verification!.storeIdentifier as unknown as {
        overrides: Record<string, { hash: (identifier: string) => Promise<string> }>;
      }
    ).overrides;

    const stored = await overrides['reset-password:']!.hash('reset-password:tok-1');

    expect(stored).toBe(resetTokenStoredIdentifier('tok-1'));
    expect(stored).toMatch(/^reset-password:[0-9a-f]{64}$/);
    expect(stored).not.toContain('tok-1');
  });

  it('sendResetPassword silently skips OAuth-only accounts (no credential account, no email)', async () => {
    vi.mocked(findCredentialAccount).mockResolvedValue(null);

    await auth.options.emailAndPassword!.sendResetPassword!({
      user: RESET_USER,
      url: 'http://localhost:3000/api/auth/reset-password/tok-2?callbackURL=%2Freset-password',
      token: 'tok-2',
    });

    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('onPasswordReset invalidates remaining tokens and sends the password-changed notification', async () => {
    await auth.options.emailAndPassword!.onPasswordReset!({ user: RESET_USER });

    expect(deleteUserResetTokens).toHaveBeenCalledWith('user-1');
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-changed',
        recipientKey: 'user:user-1',
        data: {
          to: 'user@example.com',
          userName: 'Test User',
          resetPasswordUrl: 'http://localhost:3000/forgot-password',
        },
      }),
    );
  });
});

describe('account update hook (password-changed notification)', () => {
  const runAccountUpdateHook = (path?: string, user: unknown = makeUser()) =>
    auth.options.databaseHooks!.account!.update!.after!(
      { id: 'account-1', userId: 'user-1' } as never,
      {
        path,
        context: { session: user ? { user } : null },
      } as never,
    );

  it('enqueues a password-changed notification after /change-password updates the account', async () => {
    await runAccountUpdateHook('/change-password');

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-changed',
        recipientKey: 'user:user-1',
        data: {
          to: 'user@example.com',
          userName: 'Test User',
          resetPasswordUrl: 'http://localhost:3000/forgot-password',
        },
      }),
    );
  });

  it('ignores account updates from other endpoints (OAuth token refreshes, /reset-password has onPasswordReset)', async () => {
    await runAccountUpdateHook('/callback/github');
    await runAccountUpdateHook('/reset-password');
    await runAccountUpdateHook();

    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('logs instead of notifying when the request carries no session', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runAccountUpdateHook('/change-password', null)).resolves.toBeUndefined();

    expect(enqueueEmail).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('no session user'), { accountId: 'account-1' });
    error.mockRestore();
  });

  it('does not fail the password change when the enqueue throws', async () => {
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('queue down'));

    await expect(runAccountUpdateHook('/change-password')).resolves.toBeUndefined();
  });
});

describe('user update hook (2FA change notifications)', () => {
  const runUpdateHook = (user: unknown, path?: string) =>
    auth.options.databaseHooks!.user!.update!.after!(user as never, (path ? { path } : undefined) as never);

  it('enqueues an enabled notification when a two-factor endpoint flips the flag on', async () => {
    await runUpdateHook(makeUser({ twoFactorEnabled: true }), '/two-factor/verify-totp');

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'two-factor-enabled',
        recipientKey: 'user:user-1',
        data: { to: 'user@example.com', userName: 'Test User' },
      }),
    );
  });

  it('enqueues a disabled notification when 2FA is turned off', async () => {
    await runUpdateHook(makeUser({ twoFactorEnabled: false }), '/two-factor/disable');

    expect(enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({ type: 'two-factor-disabled' }));
  });

  it('ignores user updates from outside the two-factor endpoints', async () => {
    await runUpdateHook(makeUser({ twoFactorEnabled: true }), '/some-other-path');
    await runUpdateHook(makeUser({ twoFactorEnabled: true }));

    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('does not fail the update when the email enqueue throws', async () => {
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('queue down'));

    await expect(
      runUpdateHook(makeUser({ twoFactorEnabled: true }), '/two-factor/verify-totp'),
    ).resolves.toBeUndefined();
  });
});
