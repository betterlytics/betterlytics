import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMinutes } from 'date-fns';
import { getCachedSession } from '@/auth/api-auth';
import { checkRateLimit, sendVerificationEmail } from '@/services/account/verification.service';
import { resendVerificationEmailAction } from '@/app/actions/auth/verification.action';
import { makeUser } from '@/test/auth-fixtures';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(
    async () => (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  ),
}));
vi.mock('@/lib/env', () => ({
  env: {
    DEMO_DASHBOARD_ID: undefined,
  },
}));
vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDemoDashboardContext: vi.fn(),
  executeWithDemoCache: vi.fn(),
  getFnSignature: vi.fn(() => 'test-signature'),
}));
vi.mock('@/services/account/verification.service', () => ({
  checkRateLimit: vi.fn(),
  sendVerificationEmail: vi.fn(),
  verifyEmail: vi.fn(),
}));
vi.mock('@/services/dashboard/verification.service', () => ({
  checkTrackingDataExists: vi.fn(),
}));

const SESSION_EMAIL = 'owner@example.com';
const OTHER_EMAIL = 'victim@example.com';

function signIn(emailVerified = false) {
  vi.mocked(getCachedSession).mockResolvedValue({
    user: makeUser({ email: SESSION_EMAIL, emailVerified }),
    session: { token: 'token', expiresAt: new Date(Date.now() + 60_000) },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
});

describe('resendVerificationEmailAction', () => {
  it('redirects to sign-in without a session, revealing nothing about any account', async () => {
    vi.mocked(getCachedSession).mockResolvedValue(null);

    const error = await resendVerificationEmailAction().then(
      () => null,
      (e: { digest?: string }) => e,
    );

    expect(error?.digest).toContain('NEXT_REDIRECT');
    expect(error?.digest).toContain('/signin');
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('mails the session user', async () => {
    signIn();

    const result = await resendVerificationEmailAction();

    expect(result.success).toBe(true);
    expect(checkRateLimit).toHaveBeenCalledWith(SESSION_EMAIL);
    expect(sendVerificationEmail).toHaveBeenCalledWith({ email: SESSION_EMAIL });
  });

  it('ignores a client-supplied email', async () => {
    signIn();

    // @ts-expect-error the action must ignore a client-supplied email
    await resendVerificationEmailAction({ email: OTHER_EMAIL });

    expect(checkRateLimit).toHaveBeenCalledWith(SESSION_EMAIL);
    expect(sendVerificationEmail).toHaveBeenCalledWith({ email: SESSION_EMAIL });
  });

  it('tells an already verified user instead of sending', async () => {
    signIn(true);

    const result = await resendVerificationEmailAction();

    expect(result).toMatchObject({
      success: false,
      error: { message: 'emailAlreadyVerified' },
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('reports the remaining cooldown instead of sending', async () => {
    signIn();
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      nextAllowedAt: addMinutes(new Date(), 3),
    });

    const result = await resendVerificationEmailAction();

    expect(result).toMatchObject({
      success: false,
      error: { message: 'verificationEmailCooldown {"minutes":3}' },
    });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('keeps send failures out of the client response', async () => {
    signIn();
    vi.mocked(sendVerificationEmail).mockRejectedValue(new Error('User not found'));

    const result = await resendVerificationEmailAction();

    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain('User not found');
  });
});
