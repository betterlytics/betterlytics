import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { auth, getEnabledOAuthProviders } from '@/lib/better-auth';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { enqueueEmail } from '@/services/email/email.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findUserById } from '@/repositories/postgres/user.repository';
import { makeUser, hashPassword } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    AUTH_URL: 'http://localhost:3000',
    AUTH_SECRET: 'test-auth-secret',
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
  deleteAllUserSessions: vi.fn(),
  deleteOtherUserSessions: vi.fn(),
  countUserSessions: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserById: vi.fn(),
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

  it.each(['/change-password', '/request-password-reset', '/reset-password/some-token', '/update-user'])(
    '%s returns 404 (these mutations run through our server actions)',
    async (path) => {
      await expect(runBeforeHook(path)).rejects.toMatchObject({ statusCode: 404 });
    },
  );

  it('leaves the live endpoints alone', async () => {
    await expect(runBeforeHook('/sign-in/email', { email: 'user@example.com' })).resolves.toBeUndefined();
  });

  describe('per-email sign-in throttle', () => {
    it('throws 429 once one email exhausts its attempts, counting case-insensitively', async () => {
      for (let i = 0; i < 10; i++) {
        await expect(
          runBeforeHook('/sign-in/email', { email: i % 2 ? 'Throttled@Example.com' : 'throttled@example.com' }),
        ).resolves.toBeUndefined();
      }

      await expect(runBeforeHook('/sign-in/email', { email: 'throttled@example.com' })).rejects.toMatchObject({
        statusCode: 429,
      });
    });

    it('does not throttle other accounts', async () => {
      await expect(runBeforeHook('/sign-in/email', { email: 'other@example.com' })).resolves.toBeUndefined();
    });

    it('ignores requests without a usable email (better-auth validates those)', async () => {
      await expect(runBeforeHook('/sign-in/email', { email: 42 })).resolves.toBeUndefined();
      await expect(runBeforeHook('/sign-in/email', {})).resolves.toBeUndefined();
    });
  });
});

describe('built-in rate limiting (upstream characterization)', () => {
  it('throttles credential sign-in per IP at 3 attempts per 10s when enabled', async () => {
    // Standalone instance (memory adapter): pins the strict special rule better-auth
    // ships for /sign-in/* — the production posture our auth endpoints rely on.
    const { betterAuth } = await import('better-auth');
    const testAuth = betterAuth({
      baseURL: 'http://localhost:3000',
      secret: 'test-secret',
      emailAndPassword: { enabled: true },
      rateLimit: { enabled: true },
    });

    const signIn = () =>
      testAuth.handler(
        new Request('http://localhost:3000/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong-password-1' }),
        }),
      );

    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await signIn()).status);
    }

    expect(statuses.slice(0, 3)).not.toContain(429);
    expect(statuses[3]).toBe(429);
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
