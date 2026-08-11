/**
 * Characterization tests for the next-auth configuration (internal issue #50).
 *
 * Unlike the service tests, these intentionally pin the ENGINE-level contract
 * that the better-auth migration (#51/#52) must reproduce: the authorize flow
 * (including UserException codes the sign-in UI depends on for the 2FA prompt),
 * the credentials-login database-session hack (the session cookie value IS the
 * database session token), and the session object shape consumed by the app.
 * After the migration these tests should be re-pointed at the better-auth
 * equivalents — the assertions describe behavior, not next-auth internals.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session, User } from 'next-auth';
import { authOptions, getEnabledOAuthProviders } from '@/lib/auth';
import { findUserByEmail, createUser, verifyUserPassword } from '@/repositories/postgres/user.repository';
import { getUserSettings, createDefaultUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { setLocaleCookie } from '@/constants/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { makeUser, makeTotpEnrollment } from '@/test/auth-fixtures';

const prismaMock = vi.hoisted(() => ({
  session: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  account: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({
  env: {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'admin-Password-1',
    TOTP_SECRET_ENCRYPTION_KEY: 'test-totp-encryption-key-32chars',
    GITHUB_ID: '',
    GITHUB_SECRET: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    DEMO_DASHBOARD_ID: undefined,
  },
}));
vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  registerUser: vi.fn(),
  verifyUserPassword: vi.fn(),
  findCredentialAccount: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserDashboardWithDashboardOrNull: vi.fn(),
}));
vi.mock('@/services/account/userSettings.service', () => ({
  getUserSettings: vi.fn(),
  createDefaultUserSettings: vi.fn(),
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
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

// eslint-disable-next-line no-unused-vars -- type-signature parameter name, not a real binding
type AuthorizeFn = (credentials: Record<string, string> | undefined) => Promise<User | null>;

function getAuthorize(): AuthorizeFn {
  const provider = authOptions.providers.find((p) => p.id === 'credentials') as unknown as {
    authorize?: AuthorizeFn;
    options?: { authorize?: AuthorizeFn };
  };
  const authorize = provider.options?.authorize ?? provider.authorize;
  if (!authorize) throw new Error('credentials provider has no authorize function');
  return authorize;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.session.create.mockImplementation(async ({ data }: { data: unknown }) => data);
});

describe('provider setup', () => {
  it('always offers credentials login', () => {
    expect(authOptions.providers.some((p) => p.id === 'credentials')).toBe(true);
  });

  it('reports OAuth providers as disabled when their env vars are missing', () => {
    expect(getEnabledOAuthProviders()).toEqual({ google: false, github: false });
  });

  it('uses database sessions with the documented lifetimes', () => {
    expect(authOptions.session).toMatchObject({
      strategy: 'database',
      maxAge: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    });
  });
});

describe('authorize (credentials provider)', () => {
  const PASSWORD = 'Correct-horse-1';

  it('returns null when credentials are missing', async () => {
    expect(await getAuthorize()(undefined)).toBeNull();
    expect(await getAuthorize()({ email: 'user@example.com', password: '' })).toBeNull();
    expect(await getAuthorize()({ email: '', password: PASSWORD })).toBeNull();
  });

  it('returns the user for valid credentials', async () => {
    const user = makeUser();
    vi.mocked(findUserByEmail).mockResolvedValue(user);
    vi.mocked(verifyUserPassword).mockResolvedValue(true);

    const result = await getAuthorize()({ email: user.email, password: PASSWORD });

    expect(result).toMatchObject({ id: user.id, email: user.email });
  });

  it('returns null for a wrong password', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser());
    vi.mocked(verifyUserPassword).mockResolvedValue(false);

    expect(await getAuthorize()({ email: 'user@example.com', password: 'Wrong-password-1' })).toBeNull();
  });

  it('propagates UserException codes so the sign-in UI can prompt for 2FA', async () => {
    const enrollment = makeTotpEnrollment();
    vi.mocked(findUserByEmail).mockResolvedValue(
      makeUser({ twoFactorEnabled: true, totpSecret: enrollment.encryptedSecret }),
    );
    vi.mocked(verifyUserPassword).mockResolvedValue(true);

    await expect(getAuthorize()({ email: 'user@example.com', password: PASSWORD })).rejects.toMatchObject({
      name: 'UserException',
      message: 'missing_otp',
    });
  });

  it('swallows unexpected errors into a null result (login denied, no crash)', async () => {
    vi.mocked(findUserByEmail).mockRejectedValue(new Error('db down'));

    expect(await getAuthorize()({ email: 'user@example.com', password: PASSWORD })).toBeNull();
  });

  it('bootstraps the admin account when admin credentials hit an empty database', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockResolvedValue(makeUser({ email: 'admin@example.com', role: 'admin' }));

    const result = await getAuthorize()({ email: 'admin@example.com', password: 'admin-Password-1' });

    expect(result).toMatchObject({ email: 'admin@example.com', role: 'admin' });
  });
});

describe('signIn callback', () => {
  it('rejects the dummy provider', async () => {
    const result = await authOptions.callbacks!.signIn!({
      user: makeUser() as never,
      account: { provider: 'dummy', type: 'oauth', providerAccountId: 'x' },
    });

    expect(result).toBe(false);
  });

  it('creates a 30-day database session for credentials logins and hands the token to the jwt step', async () => {
    const user = makeUser() as User & { sessionToken?: string };
    const before = Date.now();

    const result = await authOptions.callbacks!.signIn!({
      user: user as never,
      account: { provider: 'credentials', type: 'credentials', providerAccountId: 'credentials' },
    });

    expect(result).toBe(true);
    const sessionData = prismaMock.session.create.mock.calls[0][0].data;
    expect(sessionData.userId).toBe(user.id);
    expect(sessionData.sessionToken).toMatch(/^[0-9a-f]{64}$/);
    expect(user.sessionToken).toBe(sessionData.sessionToken);

    const lifetimeDays = (sessionData.expires.getTime() - before) / 86_400_000;
    expect(lifetimeDays).toBeGreaterThan(29.9);
    expect(lifetimeDays).toBeLessThan(30.1);
  });

  it('lets OAuth logins through without creating a manual session (adapter owns it)', async () => {
    const result = await authOptions.callbacks!.signIn!({
      user: makeUser() as never,
      account: { provider: 'github', type: 'oauth', providerAccountId: 'gh-1' },
    });

    expect(result).toBe(true);
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  it('blocks the login when the session cannot be persisted', async () => {
    prismaMock.session.create.mockRejectedValue(new Error('db down'));

    const result = await authOptions.callbacks!.signIn!({
      user: makeUser() as never,
      account: { provider: 'credentials', type: 'credentials', providerAccountId: 'credentials' },
    });

    expect(result).toBe(false);
  });
});

describe('jwt callback and cookie encoding', () => {
  it('carries the database session token through the jwt callback', async () => {
    const user = Object.assign(makeUser(), { sessionToken: 'db-session-token' });

    const token = await authOptions.callbacks!.jwt!({ token: {}, user: user as never } as never);

    expect(token).toEqual({ sessionToken: 'db-session-token' });
  });

  it('stores the user id on the token when there is no session token (OAuth path)', async () => {
    const token = await authOptions.callbacks!.jwt!({ token: {}, user: makeUser() as never } as never);

    expect(token).toMatchObject({ uid: 'user-1' });
  });

  it('writes the raw database session token as the cookie value (no JWT wrapping)', async () => {
    const encoded = await authOptions.jwt!.encode!({
      token: { sessionToken: 'db-session-token' },
      secret: 'irrelevant',
      maxAge: 60,
    } as never);

    expect(encoded).toBe('db-session-token');
  });
});

describe('session callback (session object shape)', () => {
  function buildSession(userOverrides: Record<string, unknown> = {}) {
    const dbUser = { ...makeUser(), githubStarPromptState: 'unprompted', ...userOverrides };
    return authOptions.callbacks!.session!({
      session: { user: {}, expires: '' } as unknown as Session,
      user: dbUser as never,
      token: {} as never,
    } as never);
  }

  it('exposes the identity fields the app consumes', async () => {
    const session = await buildSession();

    expect(session.user).toMatchObject({
      id: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
      role: 'admin',
      twoFactorEnabled: false,
      onboardingCompletedAt: expect.any(Date),
      termsAcceptedVersion: 1,
      changelogVersionSeen: 'v0',
      githubStarPromptState: 'unprompted',
    });
  });

  it('derives hasPassword from the credential account instead of exposing the hash', async () => {
    prismaMock.account.findFirst.mockResolvedValue({ id: 'account-1' });
    const withPassword = (await buildSession()) as { user?: { hasPassword?: boolean } };

    prismaMock.account.findFirst.mockResolvedValue(null);
    const oauthOnly = (await buildSession()) as { user?: { hasPassword?: boolean } };

    expect(withPassword.user!.hasPassword).toBe(true);
    expect(oauthOnly.user!.hasPassword).toBe(false);
    expect(withPassword.user).not.toHaveProperty('passwordHash');
  });

  it('does not carry user settings on the session (identity-only session, issue #79)', async () => {
    const session = await buildSession();

    expect(session.user).not.toHaveProperty('settings');
  });
});

describe('events', () => {
  it('applies the saved language on sign-in for existing users', async () => {
    vi.mocked(getUserSettings).mockResolvedValue({ language: 'da' } as never);

    await authOptions.events!.signIn!({ user: makeUser() as never, account: null, isNewUser: false });

    expect(setLocaleCookie).toHaveBeenCalledWith('da');
  });

  it('leaves the locale alone for brand-new users', async () => {
    await authOptions.events!.signIn!({ user: makeUser() as never, account: null, isNewUser: true });

    expect(getUserSettings).not.toHaveBeenCalled();
    expect(setLocaleCookie).not.toHaveBeenCalled();
  });

  it('does not fail sign-in when the locale sync throws', async () => {
    vi.mocked(getUserSettings).mockRejectedValue(new Error('db down'));

    await expect(
      authOptions.events!.signIn!({ user: makeUser() as never, account: null, isNewUser: false }),
    ).resolves.toBeUndefined();
  });

  it('provisions a starter subscription and default settings for new (OAuth-created) users', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    await authOptions.events!.createUser!({ user: makeUser() as never });

    expect(createStarterSubscriptionForUser).toHaveBeenCalledWith('user-1');
    expect(createDefaultUserSettings).toHaveBeenCalledWith('user-1');
  });

  it('sends a verification email to new unverified users when verification is enabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    prismaMock.user.findUnique.mockResolvedValue({ emailVerified: false });

    await authOptions.events!.createUser!({ user: makeUser() as never });

    expect(sendVerificationEmail).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('skips the verification email when the provider already verified the address', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    prismaMock.user.findUnique.mockResolvedValue({ emailVerified: true });

    await authOptions.events!.createUser!({ user: makeUser() as never });

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('skips the verification email when the feature is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    await authOptions.events!.createUser!({ user: makeUser() as never });

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
