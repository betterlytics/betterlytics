import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initiatePasswordReset,
  resetPassword,
  validateResetToken,
  sendPasswordChangedNotification,
} from '@/services/auth/passwordReset.service';
import {
  findUserByEmail,
  findUserById,
  findCredentialAccount,
  updateUserPassword,
} from '@/repositories/postgres/user.repository';
import {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  deleteUserPasswordResetTokens,
} from '@/repositories/postgres/passwordReset.repository';
import * as SessionRepository from '@/repositories/postgres/session.repository';
import { enqueueEmail } from '@/services/email/email.service';
import type { PasswordResetToken } from '@/entities/auth/passwordReset.entities';
import { makeUser } from '@/test/auth-fixtures';

vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  findCredentialAccount: vi.fn(),
  updateUserPassword: vi.fn(),
}));
vi.mock('@/lib/env', () => ({
  env: {
    PUBLIC_BASE_URL: 'https://app.test',
  },
}));
vi.mock('@/repositories/postgres/passwordReset.repository', () => ({
  createPasswordResetToken: vi.fn(),
  findPasswordResetToken: vi.fn(),
  deletePasswordResetToken: vi.fn(),
  deleteUserPasswordResetTokens: vi.fn(),
}));
vi.mock('@/repositories/postgres/session.repository', () => ({
  deleteAllUserSessions: vi.fn(),
  deleteOtherUserSessions: vi.fn(),
  countUserSessions: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

const BASE_URL = 'https://app.test';

function makeResetToken(overrides: Partial<PasswordResetToken> = {}): PasswordResetToken {
  return {
    id: 'prt-1',
    token: 'hashed-token',
    userId: 'user-1',
    expires: new Date(Date.now() + 30 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Users have a credential account (a password) unless a test overrides this.
  vi.mocked(findCredentialAccount).mockResolvedValue({ id: 'account-1' });
});

describe('initiatePasswordReset', () => {
  it('reports success for an unknown email without creating a token or sending mail (no enumeration)', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const result = await initiatePasswordReset({ email: 'nobody@example.com' });

    expect(result).toBe(true);
    expect(createPasswordResetToken).not.toHaveBeenCalled();
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('reports success for an OAuth-only account without creating a token or sending mail', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser());
    vi.mocked(findCredentialAccount).mockResolvedValue(null);

    const result = await initiatePasswordReset({ email: 'user@example.com' });

    expect(result).toBe(true);
    expect(createPasswordResetToken).not.toHaveBeenCalled();
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('invalidates previous reset tokens before issuing a new one', async () => {
    const order: string[] = [];
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser());
    vi.mocked(deleteUserPasswordResetTokens).mockImplementation(async () => {
      order.push('deleteOldTokens');
    });
    vi.mocked(createPasswordResetToken).mockImplementation(async () => {
      order.push('createToken');
      return makeResetToken();
    });

    await initiatePasswordReset({ email: 'user@example.com' });

    expect(order).toEqual(['deleteOldTokens', 'createToken']);
  });

  it('issues a 64-char hex token expiring in ~1 hour and emails a reset link containing it', async () => {
    const user = makeUser();
    vi.mocked(findUserByEmail).mockResolvedValue(user);
    vi.mocked(createPasswordResetToken).mockResolvedValue(makeResetToken());

    const before = Date.now();
    const result = await initiatePasswordReset({ email: user.email });

    expect(result).toBe(true);
    const [tokenUserId, rawToken, expiry] = vi.mocked(createPasswordResetToken).mock.calls[0];
    expect(tokenUserId).toBe(user.id);
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);

    const expiryMinutes = (expiry.getTime() - before) / 60_000;
    expect(expiryMinutes).toBeGreaterThan(55);
    expect(expiryMinutes).toBeLessThan(65);

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'reset-password',
        data: expect.objectContaining({
          to: user.email,
          resetUrl: `${BASE_URL}/reset-password?token=${rawToken}`,
          expirationTime: '1 hour',
        }),
      }),
    );
  });

  it('wraps repository failures in a generic error', async () => {
    vi.mocked(findUserByEmail).mockRejectedValue(new Error('db down'));

    await expect(initiatePasswordReset({ email: 'user@example.com' })).rejects.toThrow(
      'Failed to initiate password reset. Please try again.',
    );
  });
});

describe('resetPassword', () => {
  const resetData = { token: 'raw-token', newPassword: 'New-password-1', confirmPassword: 'New-password-1' };

  it('rejects an unknown token', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(null);

    await expect(resetPassword(resetData)).rejects.toThrow('Failed to reset password');
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it('rejects and deletes an expired token', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(
      makeResetToken({ expires: new Date(Date.now() - 1000) }),
    );

    await expect(resetPassword(resetData)).rejects.toThrow('Failed to reset password');
    expect(deletePasswordResetToken).toHaveBeenCalledWith(resetData.token);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it('rejects when the target account is OAuth-only, without touching password or sessions', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(makeResetToken());
    vi.mocked(findUserById).mockResolvedValue(makeUser());
    vi.mocked(findCredentialAccount).mockResolvedValue(null);

    await expect(resetPassword(resetData)).rejects.toThrow('Failed to reset password');
    expect(updateUserPassword).not.toHaveBeenCalled();
    expect(SessionRepository.deleteAllUserSessions).not.toHaveBeenCalled();
  });

  it('rejects when the target user no longer exists', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(makeResetToken());
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(resetPassword(resetData)).rejects.toThrow('Failed to reset password');
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it('updates the password, revokes ALL sessions, then consumes the tokens — in that order', async () => {
    const user = makeUser();
    const order: string[] = [];
    vi.mocked(findPasswordResetToken).mockResolvedValue(makeResetToken({ userId: user.id }));
    vi.mocked(findUserById).mockResolvedValue(user);
    vi.mocked(updateUserPassword).mockImplementation(async () => {
      order.push('updatePassword');
    });
    vi.mocked(SessionRepository.deleteAllUserSessions).mockImplementation(async () => {
      order.push('revokeAllSessions');
      return 2;
    });
    vi.mocked(deleteUserPasswordResetTokens).mockImplementation(async () => {
      order.push('consumeTokens');
    });

    const result = await resetPassword(resetData);

    expect(result).toBe(true);
    expect(updateUserPassword).toHaveBeenCalledWith(user.id, resetData.newPassword);
    expect(SessionRepository.deleteAllUserSessions).toHaveBeenCalledWith(user.id);
    expect(order).toEqual(['updatePassword', 'revokeAllSessions', 'consumeTokens']);
  });

  it('sends a password-changed notification email on success', async () => {
    const user = makeUser();
    vi.mocked(findPasswordResetToken).mockResolvedValue(makeResetToken({ userId: user.id }));
    vi.mocked(findUserById).mockResolvedValue(user);

    await resetPassword(resetData);

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-changed',
        data: expect.objectContaining({ to: user.email }),
      }),
    );
  });

  it('does not revoke sessions when the password update fails', async () => {
    const user = makeUser();
    vi.mocked(findPasswordResetToken).mockResolvedValue(makeResetToken({ userId: user.id }));
    vi.mocked(findUserById).mockResolvedValue(user);
    vi.mocked(updateUserPassword).mockRejectedValue(new Error('db down'));

    await expect(resetPassword(resetData)).rejects.toThrow('Failed to reset password');
    expect(SessionRepository.deleteAllUserSessions).not.toHaveBeenCalled();
  });
});

describe('validateResetToken', () => {
  it('returns false for an unknown token', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(null);

    expect(await validateResetToken('nope')).toBe(false);
  });

  it('returns false for an expired token and deletes it', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(
      makeResetToken({ expires: new Date(Date.now() - 1000) }),
    );

    expect(await validateResetToken('expired')).toBe(false);
    expect(deletePasswordResetToken).toHaveBeenCalledWith('expired');
  });

  it('returns true for a live token', async () => {
    vi.mocked(findPasswordResetToken).mockResolvedValue(makeResetToken());

    expect(await validateResetToken('live')).toBe(true);
  });

  it('returns false (fails closed) when the lookup throws', async () => {
    vi.mocked(findPasswordResetToken).mockRejectedValue(new Error('db down'));

    expect(await validateResetToken('any')).toBe(false);
  });
});

describe('sendPasswordChangedNotification', () => {
  it('swallows enqueue failures instead of failing the caller', async () => {
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('mailer down'));

    await expect(sendPasswordChangedNotification('user-1', 'user@example.com', 'Test')).resolves.toBeUndefined();
  });
});
