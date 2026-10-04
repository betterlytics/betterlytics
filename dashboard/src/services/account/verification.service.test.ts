import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { enqueueEmail } from '@/services/email/email.service';
import { isFeatureEnabled } from '@/lib/feature-flags';

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));
vi.mock('@/services/email/recipient-key.service', () => ({
  createUserRecipientKey: vi.fn((userId: string) => `user:${userId}`),
}));

const USER = { id: 'user-1', email: 'user@example.com', name: 'Test User' };
const URL = 'https://app.test/api/auth/verify-email?token=jwt&callbackURL=%2Fverify-email%3Fverified%3D1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
  vi.mocked(enqueueEmail).mockResolvedValue('enqueued');
});

describe('sendVerificationEmail', () => {
  it('no-ops when account verification is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    await sendVerificationEmail(USER, URL);

    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('enqueues the verification email with the better-auth link', async () => {
    await sendVerificationEmail(USER, URL);

    expect(enqueueEmail).toHaveBeenCalledWith({
      type: 'email-verification',
      recipientKey: 'user:user-1',
      campaignKey: 'email-verification',
      data: {
        to: 'user@example.com',
        userName: 'Test User',
        verificationUrl: URL,
      },
    });
  });

  it('surfaces a queue-throttled resend as a 429', async () => {
    vi.mocked(enqueueEmail).mockResolvedValue('throttled');

    await expect(sendVerificationEmail(USER, URL)).rejects.toMatchObject({ statusCode: 429 });
  });

  it('does not treat a feature-flag skip as throttled', async () => {
    vi.mocked(enqueueEmail).mockResolvedValue('skipped');

    await expect(sendVerificationEmail(USER, URL)).resolves.toBeUndefined();
  });
});
