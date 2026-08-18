import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPasswordChangedNotification } from '@/services/auth/passwordReset.service';
import { enqueueEmail } from '@/services/email/email.service';

vi.mock('@/lib/env', () => ({
  env: {
    PUBLIC_BASE_URL: 'https://app.test',
  },
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
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
