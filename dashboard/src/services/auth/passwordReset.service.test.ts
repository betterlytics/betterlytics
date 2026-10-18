import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@/entities/auth/user.entities';
import {
  findResetTokenEmail,
  resetTokenStoredIdentifier,
  sendPasswordChangedNotification,
  sendResetPasswordEmail,
} from '@/services/auth/passwordReset.service';
import { enqueueEmail } from '@/services/email/email.service';
import { deleteUserResetTokens, findResetTokenUserId } from '@/repositories/postgres/resetToken.repository';
import { findUserById } from '@/repositories/postgres/user.repository';

vi.mock('@/lib/env', () => ({
  env: {
    PUBLIC_BASE_URL: 'https://app.test',
  },
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));
vi.mock('@/repositories/postgres/resetToken.repository', () => ({
  RESET_TOKEN_PREFIX: 'reset-password:',
  findResetTokenUserId: vi.fn(),
  deleteUserResetTokens: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserById: vi.fn(),
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

describe('findResetTokenEmail', () => {
  it("looks up the hashed identifier and returns its account's email", async () => {
    vi.mocked(findResetTokenUserId).mockResolvedValue('user-1');
    vi.mocked(findUserById).mockResolvedValue({ id: 'user-1', email: 'ada@example.com' } as User);

    await expect(findResetTokenEmail('raw-token')).resolves.toBe('ada@example.com');
    expect(findResetTokenUserId).toHaveBeenCalledWith(resetTokenStoredIdentifier('raw-token'));
    expect(findUserById).toHaveBeenCalledWith('user-1');
  });

  it('returns null for an unknown or expired token, without looking up a user', async () => {
    vi.mocked(findResetTokenUserId).mockResolvedValue(null);

    await expect(findResetTokenEmail('raw-token')).resolves.toBeNull();
    expect(findUserById).not.toHaveBeenCalled();
  });
});

describe('sendResetPasswordEmail', () => {
  const USER = { id: 'user-1', email: 'user@example.com', name: 'Test' };

  it('prunes older tokens and enqueues the reset email', async () => {
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
