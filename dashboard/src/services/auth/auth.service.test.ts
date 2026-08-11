/**
 * Characterization tests for the auth service (internal issue #50).
 *
 * Sign-in itself moved into better-auth (#51) — its contract is pinned in
 * better-auth-config.test.ts. What remains here: registration uniqueness and
 * dashboard authorization context. Repositories and email are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerNewUser,
  getAuthorizedDashboardContextOrNull,
  assertPublicDashboardAccess,
} from '@/services/auth/auth.service';
import { findUserByEmail, registerUser } from '@/repositories/postgres/user.repository';
import { findUserDashboardWithDashboardOrNull } from '@/repositories/postgres/dashboard.repository';
import { makeUser } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'admin-Password-1',
    DEMO_DASHBOARD_ID: 'demo-dashboard-id',
    TOTP_SECRET_ENCRYPTION_KEY: 'test-totp-encryption-key-32chars',
  },
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
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerNewUser', () => {
  const registration = {
    email: 'new@example.com',
    name: 'New User',
    password: 'Valid-password-1',
    acceptedTerms: true as const,
    language: 'en' as const,
  };

  it('throws a UserException when the email is already taken', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser({ email: registration.email }));

    await expect(registerNewUser(registration)).rejects.toMatchObject({
      name: 'UserException',
      message: 'User with that email already exists.',
    });
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('registers and returns the new user when the email is free', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(registerUser).mockResolvedValue(makeUser({ email: registration.email }));

    const result = await registerNewUser(registration);

    expect(registerUser).toHaveBeenCalledWith(registration);
    expect(result.email).toBe(registration.email);
  });
});

describe('getAuthorizedDashboardContextOrNull', () => {
  it('returns null when the user has no access to the dashboard', async () => {
    vi.mocked(findUserDashboardWithDashboardOrNull).mockResolvedValue(null);

    const result = await getAuthorizedDashboardContextOrNull({ userId: 'user-1', dashboardId: 'dash-1' });

    expect(result).toBeNull();
  });

  it('returns a parsed auth context for an authorized user', async () => {
    vi.mocked(findUserDashboardWithDashboardOrNull).mockResolvedValue({
      dashboardUser: { userId: 'user-1', dashboardId: 'dash-1', role: 'owner' },
      dashboard: { id: 'dash-1', siteId: 'site-1' },
    } as never);

    const result = await getAuthorizedDashboardContextOrNull({ userId: 'user-1', dashboardId: 'dash-1' });

    expect(result).toEqual({
      role: 'owner',
      userId: 'user-1',
      dashboardId: 'dash-1',
      siteId: 'site-1',
      isDemo: false,
    });
  });
});

describe('assertPublicDashboardAccess', () => {
  it('allows the configured demo dashboard', async () => {
    await expect(assertPublicDashboardAccess('demo-dashboard-id')).resolves.toBeUndefined();
  });

  it('rejects any other dashboard with a not-found error', async () => {
    await expect(assertPublicDashboardAccess('some-other-dashboard')).rejects.toThrow();
  });
});
