/**
 * Characterization tests for the TOTP (2FA) service (internal issue #50).
 *
 * Pins behavior the better-auth migration must preserve: secrets are stored
 * AES-256-GCM encrypted (never plaintext), the otpauth:// enrollment URL,
 * enable/disable guard rails, and the validation algorithm existing enrolled
 * users depend on. Crypto runs for real; only repositories/email are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as OTPAuth from 'otpauth';
import { setupTotp, enableTotp, disableTotp, isValidTotp } from '@/services/auth/totp.service';
import * as UsersRepository from '@/repositories/postgres/user.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { symmetricDecrypt } from '@/lib/crypto';
import { makeUser, hashPassword, makeTotpEnrollment, TEST_TOTP_ENCRYPTION_KEY } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    TOTP_SECRET_ENCRYPTION_KEY: 'test-totp-encryption-key-32chars',
  },
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserById: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function passwordUser(overrides: Parameters<typeof makeUser>[0] = {}) {
  return makeUser({ passwordHash: hashPassword('Some-password-1'), ...overrides });
}

describe('isValidTotp', () => {
  it('accepts a currently-valid code for the encrypted secret', () => {
    const enrollment = makeTotpEnrollment();

    expect(isValidTotp(enrollment.currentCode(), enrollment.encryptedSecret)).toBe(true);
  });

  it('rejects an incorrect code', () => {
    const enrollment = makeTotpEnrollment();

    expect(isValidTotp(enrollment.wrongCode(), enrollment.encryptedSecret)).toBe(false);
  });

  it('tolerates one period of clock drift (codes from the adjacent 30s windows validate)', () => {
    // The better-auth 2FA config must match this window, or slightly-off device clocks break login.
    const enrollment = makeTotpEnrollment();

    expect(isValidTotp(enrollment.codeAt(-30_000), enrollment.encryptedSecret)).toBe(true);
    expect(isValidTotp(enrollment.codeAt(30_000), enrollment.encryptedSecret)).toBe(true);
  });

  it('rejects codes older than the drift window', () => {
    const enrollment = makeTotpEnrollment();

    expect(isValidTotp(enrollment.codeAt(-90_000), enrollment.encryptedSecret)).toBe(false);
  });

  it('rejects a valid code from a different secret', () => {
    const enrollment = makeTotpEnrollment();
    const otherEnrollment = makeTotpEnrollment();

    expect(isValidTotp(otherEnrollment.currentCode(), enrollment.encryptedSecret)).toBe(false);
  });

  it('throws when the stored secret cannot be decrypted with the configured key', () => {
    const enrollment = makeTotpEnrollment('another-32-character-secret-key!');

    expect(() => isValidTotp('123456', enrollment.encryptedSecret)).toThrow();
  });
});

describe('setupTotp', () => {
  it('rejects when the user does not exist', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(null);

    await expect(setupTotp('missing-user')).rejects.toThrow('Failed to setup totp');
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('rejects OAuth-only accounts (TOTP requires a password)', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(makeUser({ passwordHash: null }));

    await expect(setupTotp('user-1')).rejects.toThrow('Failed to setup totp');
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('rejects when TOTP is already enabled', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(passwordUser({ totpEnabled: true }));

    await expect(setupTotp('user-1')).rejects.toThrow('Failed to setup totp');
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('stores an encrypted secret and returns a matching otpauth:// enrollment URL', async () => {
    const user = passwordUser();
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(user);

    const keyUrl = await setupTotp(user.id);

    const updateData = vi.mocked(UsersRepository.updateUser).mock.calls[0][1];
    const storedSecret = updateData.totpSecret!;
    const parsed = OTPAuth.URI.parse(keyUrl);

    expect(keyUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(parsed.issuer).toBe('Betterlytics');
    expect(parsed.label).toBe(user.email);
    expect(storedSecret).not.toBe(parsed.secret.base32);
    expect(symmetricDecrypt(storedSecret, TEST_TOTP_ENCRYPTION_KEY)).toBe(parsed.secret.base32);
    // Setup alone must not enable TOTP; that happens after code confirmation.
    expect(updateData.totpEnabled).toBeUndefined();
  });

  it('generates a fresh secret per setup call', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(passwordUser());

    const firstUrl = await setupTotp('user-1');
    const secondUrl = await setupTotp('user-1');

    expect(OTPAuth.URI.parse(firstUrl).secret.base32).not.toBe(OTPAuth.URI.parse(secondUrl).secret.base32);
  });
});

describe('enableTotp', () => {
  it('rejects when the user does not exist', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(null);

    await expect(enableTotp('missing-user', '123456')).rejects.toThrow('Failed to enable totp');
  });

  it('rejects OAuth-only accounts', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(makeUser({ passwordHash: null }));

    await expect(enableTotp('user-1', '123456')).rejects.toThrow('Failed to enable totp');
  });

  it('rejects when TOTP is already enabled', async () => {
    const enrollment = makeTotpEnrollment();
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(
      passwordUser({ totpEnabled: true, totpSecret: enrollment.encryptedSecret }),
    );

    await expect(enableTotp('user-1', enrollment.currentCode())).rejects.toThrow('Failed to enable totp');
  });

  it('rejects when setup has not been run (no secret stored)', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(passwordUser({ totpSecret: null }));

    await expect(enableTotp('user-1', '123456')).rejects.toThrow('Failed to enable totp');
  });

  it('rejects an invalid confirmation code without enabling', async () => {
    const enrollment = makeTotpEnrollment();
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(
      passwordUser({ totpSecret: enrollment.encryptedSecret }),
    );

    await expect(enableTotp('user-1', enrollment.wrongCode())).rejects.toThrow('Failed to enable totp');
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('enables TOTP for a valid confirmation code and notifies the user by email', async () => {
    const enrollment = makeTotpEnrollment();
    const user = passwordUser({ totpSecret: enrollment.encryptedSecret });
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(user);

    await enableTotp(user.id, enrollment.currentCode());

    expect(UsersRepository.updateUser).toHaveBeenCalledWith(user.id, { totpEnabled: true });
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'two-factor-enabled',
        data: expect.objectContaining({ to: user.email }),
      }),
    );
  });
});

describe('disableTotp', () => {
  it('rejects when TOTP is not enabled', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(passwordUser({ totpEnabled: false }));

    await expect(disableTotp('user-1', '123456')).rejects.toThrow('Failed to disable totp');
  });

  it('rejects an invalid code without disabling', async () => {
    const enrollment = makeTotpEnrollment();
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(
      passwordUser({ totpEnabled: true, totpSecret: enrollment.encryptedSecret }),
    );

    await expect(disableTotp('user-1', enrollment.wrongCode())).rejects.toThrow('Failed to disable totp');
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('rejects the corrupt state of TOTP enabled without a stored secret', async () => {
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(
      passwordUser({ totpEnabled: true, totpSecret: null }),
    );

    await expect(disableTotp('user-1', '123456')).rejects.toThrow('Failed to disable totp');
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('disables TOTP and clears the secret for a valid code, then notifies by email', async () => {
    const enrollment = makeTotpEnrollment();
    const user = passwordUser({ totpEnabled: true, totpSecret: enrollment.encryptedSecret });
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(user);

    await disableTotp(user.id, enrollment.currentCode());

    expect(UsersRepository.updateUser).toHaveBeenCalledWith(user.id, { totpEnabled: false, totpSecret: null });
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'two-factor-disabled',
        data: expect.objectContaining({ to: user.email }),
      }),
    );
  });

  it('still succeeds when the notification email fails to enqueue', async () => {
    const enrollment = makeTotpEnrollment();
    const user = passwordUser({ totpEnabled: true, totpSecret: enrollment.encryptedSecret });
    vi.mocked(UsersRepository.findUserById).mockResolvedValue(user);
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('mailer down'));

    await expect(disableTotp(user.id, enrollment.currentCode())).resolves.toBeUndefined();
    expect(UsersRepository.updateUser).toHaveBeenCalledWith(user.id, { totpEnabled: false, totpSecret: null });
  });
});
