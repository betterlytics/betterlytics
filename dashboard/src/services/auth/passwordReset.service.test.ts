import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isResetTokenValid,
  resetTokenStoredIdentifier,
  sendPasswordChangedNotification,
  sendResetPasswordEmail,
} from '@/services/auth/passwordReset.service';
import { enqueueEmail } from '@/services/email/email.service';
import { findCredentialAccount } from '@/repositories/postgres/user.repository';
import { deleteUserResetTokens, findResetTokenUserId } from '@/repositories/postgres/resetToken.repository';

vi.mock('@/lib/env', () => ({
  env: {
    PUBLIC_BASE_URL: 'https://app.test',
  },
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findCredentialAccount: vi.fn(),
}));
vi.mock('@/repositories/postgres/resetToken.repository', () => ({
  RESET_TOKEN_PREFIX: 'reset-password:',
  findResetTokenUserId: vi.fn(),
  deleteUserResetTokens: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resetTokenStoredIdentifier', () => {
  it('hashes the raw token but keeps the reset-password prefix', () => {
    const identifier = resetTokenStoredIdentifier('raw-token');

    expect(identifier).toMatch(/^reset-password:[0-9a-f]{64}$/);
    expect(identifier).not.toContain('raw-token');
    expect(resetTokenStoredIdentifier('raw-token')).toBe(identifier);
    expect(resetTokenStoredIdentifier('other-token')).not.toBe(identifier);
  });
});

describe('isResetTokenValid', () => {
  it('looks up the hashed identifier', async () => {
    vi.mocked(findResetTokenUserId).mockResolvedValue('user-1');

    await expect(isResetTokenValid('raw-token')).resolves.toBe(true);
    expect(findResetTokenUserId).toHaveBeenCalledWith(resetTokenStoredIdentifier('raw-token'));

    vi.mocked(findResetTokenUserId).mockResolvedValue(null);
    await expect(isResetTokenValid('raw-token')).resolves.toBe(false);
  });
});

describe('sendResetPasswordEmail', () => {
  const USER = { id: 'user-1', email: 'user@example.com', name: 'Test' };

  it('prunes older tokens and enqueues the reset email for credential accounts', async () => {
    vi.mocked(findCredentialAccount).mockResolvedValue({ id: 'account-1' } as never);

    await sendResetPasswordEmail(USER, 'https://app.test/link', 'raw-token');

    expect(deleteUserResetTokens).toHaveBeenCalledWith('user-1', resetTokenStoredIdentifier('raw-token'));
    expect(enqueueEmail).toHaveBeenCalledWith({
      type: 'reset-password',
      recipientKey: expect.any(String),
      campaignKey: resetTokenStoredIdentifier('raw-token'),
      data: {
        to: 'user@example.com',
        userName: 'Test',
        resetUrl: 'https://app.test/link',
        expirationTime: '1 hour',
      },
    });
  });

  it('silently skips OAuth-only accounts', async () => {
    vi.mocked(findCredentialAccount).mockResolvedValue(null);

    await sendResetPasswordEmail(USER, 'https://app.test/link', 'raw-token');

    expect(deleteUserResetTokens).not.toHaveBeenCalled();
    expect(enqueueEmail).not.toHaveBeenCalled();
  });
});

describe('sendPasswordChangedNotification', () => {
  it('enqueues a password-changed email pointing back at forgot-password', async () => {
    await sendPasswordChangedNotification('user-1', 'user@example.com', 'Test');

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-changed',
        data: {
          to: 'user@example.com',
          userName: 'Test',
          resetPasswordUrl: 'https://app.test/forgot-password',
        },
      }),
    );
  });

  it('swallows enqueue failures instead of failing the caller', async () => {
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('mailer down'));

    await expect(sendPasswordChangedNotification('user-1', 'user@example.com', 'Test')).resolves.toBeUndefined();
  });
});
