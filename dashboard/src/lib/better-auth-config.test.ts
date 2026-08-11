/**
 * Characterization tests for the better-auth configuration (internal issue #51).
 *
 * Successor to the next-auth auth-config tests from #50: pins the engine-level
 * contract — legacy bcrypt hashes keep verifying (permanent custom hasher),
 * the 30-day/24-hour session lifetimes, the twoFactor plugin registration,
 * the identity fields carried on the session user, and the onboarding /
 * locale side effects that moved into database hooks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { auth, getEnabledOAuthProviders } from '@/lib/better-auth';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findUserById } from '@/repositories/postgres/user.repository';
import { makeUser, hashPassword } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    BETTER_AUTH_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'test-better-auth-secret',
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
