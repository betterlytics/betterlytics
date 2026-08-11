/**
 * Characterization tests for the credentials login flow (internal issue #50).
 *
 * These pin behavior the better-auth migration (#51) must preserve: bcrypt
 * password verification, TOTP enforcement via UserException codes, admin
 * bootstrap, and registration uniqueness. Repositories and email are mocked;
 * bcrypt and TOTP crypto run for real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import {
  verifyCredentials,
  attemptAdminInitialization,
  registerNewUser,
  getAuthorizedDashboardContextOrNull,
  assertPublicDashboardAccess,
} from '@/services/auth/auth.service';
import {
  findUserByEmail,
  createUser,
  registerUser,
  verifyUserPassword,
} from '@/repositories/postgres/user.repository';
import { findUserDashboardWithDashboardOrNull } from '@/repositories/postgres/dashboard.repository';
import { UserException } from '@/lib/exceptions';
import { makeUser, hashPassword, makeTotpEnrollment } from '@/test/auth-fixtures';

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

describe('verifyCredentials', () => {
  const PASSWORD = 'Correct-horse-1';

  it('returns null for an unknown email', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const result = await verifyCredentials({ email: 'nobody@example.com', password: PASSWORD });

    expect(result).toBeNull();
  });

  it('returns null when the password check fails (wrong password or OAuth-only account)', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser());
    vi.mocked(verifyUserPassword).mockResolvedValue(false);

    const result = await verifyCredentials({ email: 'user@example.com', password: 'Wrong-password-1' });

    expect(result).toBeNull();
  });

  it('returns the user for a correct password when TOTP is disabled', async () => {
    const user = makeUser();
    vi.mocked(findUserByEmail).mockResolvedValue(user);
    vi.mocked(verifyUserPassword).mockResolvedValue(true);

    const result = await verifyCredentials({ email: 'user@example.com', password: PASSWORD });

    expect(verifyUserPassword).toHaveBeenCalledWith(user.id, PASSWORD);
    expect(result).toMatchObject({ id: user.id, email: user.email, twoFactorEnabled: false });
  });

  it('returns null (does not throw) when the stored user fails schema validation', async () => {
    const invalidUser = makeUser({ email: 'not-an-email' });
    vi.mocked(findUserByEmail).mockResolvedValue(invalidUser);
    vi.mocked(verifyUserPassword).mockResolvedValue(true);

    const result = await verifyCredentials({ email: 'user@example.com', password: PASSWORD });

    expect(result).toBeNull();
  });

  describe('with TOTP enabled', () => {
    function totpUser() {
      const enrollment = makeTotpEnrollment();
      const user = makeUser({
        twoFactorEnabled: true,
        totpSecret: enrollment.encryptedSecret,
      });
      return { enrollment, user };
    }

    it('throws UserException("missing_otp") when no code is provided', async () => {
      const { user } = totpUser();
      vi.mocked(findUserByEmail).mockResolvedValue(user);
      vi.mocked(verifyUserPassword).mockResolvedValue(true);

      const promise = verifyCredentials({ email: 'user@example.com', password: PASSWORD });

      await expect(promise).rejects.toBeInstanceOf(UserException);
      await expect(promise).rejects.toMatchObject({ message: 'missing_otp' });
    });

    it('throws UserException("invalid_otp") for a wrong code', async () => {
      const { enrollment, user } = totpUser();
      vi.mocked(findUserByEmail).mockResolvedValue(user);
      vi.mocked(verifyUserPassword).mockResolvedValue(true);

      const promise = verifyCredentials({
        email: 'user@example.com',
        password: PASSWORD,
        totp: enrollment.wrongCode(),
      });

      await expect(promise).rejects.toMatchObject({ name: 'UserException', message: 'invalid_otp' });
    });

    it('returns the user for a valid code', async () => {
      const { enrollment, user } = totpUser();
      vi.mocked(findUserByEmail).mockResolvedValue(user);
      vi.mocked(verifyUserPassword).mockResolvedValue(true);

      const result = await verifyCredentials({
        email: 'user@example.com',
        password: PASSWORD,
        totp: enrollment.currentCode(),
      });

      expect(result).toMatchObject({ id: user.id, twoFactorEnabled: true });
    });

    it('checks the password before the TOTP code (wrong password never reaches OTP)', async () => {
      const { user } = totpUser();
      vi.mocked(findUserByEmail).mockResolvedValue(user);
      vi.mocked(verifyUserPassword).mockResolvedValue(false);

      const result = await verifyCredentials({ email: 'user@example.com', password: 'Wrong-password-1' });

      expect(result).toBeNull();
    });
  });
});

describe('attemptAdminInitialization', () => {
  it('returns null when credentials do not match the admin env vars', async () => {
    const result = await attemptAdminInitialization('someone@example.com', 'whatever');

    expect(result).toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('returns null when password matches but email does not', async () => {
    const result = await attemptAdminInitialization('other@example.com', 'admin-Password-1');

    expect(result).toBeNull();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('returns null when the admin account already exists', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser({ email: 'admin@example.com' }));

    const result = await attemptAdminInitialization('admin@example.com', 'admin-Password-1');

    expect(result).toBeNull();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates the admin user with a bcrypt-hashed password and admin role', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockResolvedValue(makeUser({ email: 'admin@example.com', role: 'admin' }));

    const result = await attemptAdminInitialization('admin@example.com', 'admin-Password-1');

    expect(result).toMatchObject({ email: 'admin@example.com', role: 'admin' });
    const createData = vi.mocked(createUser).mock.calls[0][0];
    expect(createData.role).toBe('admin');
    expect(createData.passwordHash).not.toBe('admin-Password-1');
    expect(await bcrypt.compare('admin-Password-1', createData.passwordHash)).toBe(true);
  });

  it('returns null (does not throw) when user creation fails', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockRejectedValue(new Error('db down'));

    const result = await attemptAdminInitialization('admin@example.com', 'admin-Password-1');

    expect(result).toBeNull();
  });
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
