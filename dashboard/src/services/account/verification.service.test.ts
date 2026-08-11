/**
 * Characterization tests for email verification (internal issue #50).
 *
 * Pins behavior the better-auth migration must preserve: verification is
 * feature-flag gated, tokens expire after 24h, already-verified emails are
 * rejected, and the resend rate limit fails open.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMinutes, subMinutes } from 'date-fns';
import { sendVerificationEmail, verifyEmail, checkRateLimit } from '@/services/account/verification.service';
import {
  createVerificationToken,
  findVerificationToken,
  deleteVerificationToken,
  markUserEmailAsVerified,
  findVerificationTokenByIdentifier,
  deleteExpiredVerificationTokens,
} from '@/repositories/postgres/verification.repository';
import { findUserByEmail } from '@/repositories/postgres/user.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { makeUser } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    PUBLIC_BASE_URL: 'https://app.test',
  },
}));
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(),
}));
vi.mock('@/repositories/postgres/verification.repository', () => ({
  createVerificationToken: vi.fn(),
  findVerificationToken: vi.fn(),
  deleteVerificationToken: vi.fn(),
  markUserEmailAsVerified: vi.fn(),
  findVerificationTokenByIdentifier: vi.fn(),
  deleteExpiredVerificationTokens: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserByEmail: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

const EMAIL = 'user@example.com';

function makeVerificationToken(overrides: Record<string, unknown> = {}) {
  return {
    identifier: EMAIL,
    token: 'stored-token',
    expires: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
});

describe('sendVerificationEmail', () => {
  it('no-ops when account verification is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    await sendVerificationEmail({ email: EMAIL });

    expect(createVerificationToken).not.toHaveBeenCalled();
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('rejects for an unknown user', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    await expect(sendVerificationEmail({ email: EMAIL })).rejects.toThrow('Failed to send verification email');
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('rejects when the email is already verified', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser({ emailVerified: new Date() }));

    await expect(sendVerificationEmail({ email: EMAIL })).rejects.toThrow('Failed to send verification email');
    expect(createVerificationToken).not.toHaveBeenCalled();
  });

  it('purges expired tokens, issues a ~24h token, and emails a verification link containing it', async () => {
    const user = makeUser({ emailVerified: null });
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    const before = Date.now();
    await sendVerificationEmail({ email: EMAIL });

    expect(deleteExpiredVerificationTokens).toHaveBeenCalled();

    const tokenData = vi.mocked(createVerificationToken).mock.calls[0][0];
    expect(tokenData.identifier).toBe(EMAIL);
    expect(tokenData.token).toMatch(/^[0-9a-f]{64}$/);

    const expiryHours = (tokenData.expires.getTime() - before) / 3_600_000;
    expect(expiryHours).toBeGreaterThan(23);
    expect(expiryHours).toBeLessThan(25);

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'email-verification',
        data: expect.objectContaining({
          to: EMAIL,
          verificationUrl: `https://app.test/verify-email?token=${tokenData.token}`,
        }),
      }),
    );
  });
});

describe('verifyEmail', () => {
  it('fails when account verification is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    const result = await verifyEmail({ token: 'any' });

    expect(result).toEqual({ success: false, error: 'Account verification is not enabled' });
  });

  it('fails for an unknown token', async () => {
    vi.mocked(findVerificationToken).mockResolvedValue(null);

    const result = await verifyEmail({ token: 'unknown' });

    expect(result.success).toBe(false);
    expect(markUserEmailAsVerified).not.toHaveBeenCalled();
  });

  it('fails for an expired token and deletes it', async () => {
    vi.mocked(findVerificationToken).mockResolvedValue(
      makeVerificationToken({ expires: new Date(Date.now() - 1000) }) as never,
    );

    const result = await verifyEmail({ token: 'expired' });

    expect(result).toEqual({ success: false, error: 'Verification token has expired' });
    expect(deleteVerificationToken).toHaveBeenCalledWith('expired');
    expect(markUserEmailAsVerified).not.toHaveBeenCalled();
  });

  it('fails when the email is already verified, consuming the token', async () => {
    vi.mocked(findVerificationToken).mockResolvedValue(makeVerificationToken() as never);
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser({ emailVerified: new Date() }));

    const result = await verifyEmail({ token: 'valid' });

    expect(result.success).toBe(false);
    expect(deleteVerificationToken).toHaveBeenCalledWith('valid');
    expect(markUserEmailAsVerified).not.toHaveBeenCalled();
  });

  it('marks the email verified and consumes the token on success', async () => {
    vi.mocked(findVerificationToken).mockResolvedValue(makeVerificationToken() as never);
    vi.mocked(findUserByEmail).mockResolvedValue(makeUser({ emailVerified: null }));

    const result = await verifyEmail({ token: 'valid' });

    expect(result).toEqual({ success: true, email: EMAIL });
    expect(markUserEmailAsVerified).toHaveBeenCalledWith(EMAIL);
    expect(deleteVerificationToken).toHaveBeenCalledWith('valid');
  });
});

describe('checkRateLimit', () => {
  it('allows sending when no previous token exists', async () => {
    vi.mocked(findVerificationTokenByIdentifier).mockResolvedValue(null);

    expect(await checkRateLimit(EMAIL)).toEqual({ allowed: true });
  });

  it('blocks resending within the 5-minute cooldown and reports when it lifts', async () => {
    const createdAt = subMinutes(new Date(), 1);
    vi.mocked(findVerificationTokenByIdentifier).mockResolvedValue(makeVerificationToken({ createdAt }) as never);

    const result = await checkRateLimit(EMAIL);

    expect(result.allowed).toBe(false);
    expect(result.nextAllowedAt).toEqual(addMinutes(createdAt, 5));
  });

  it('allows resending once the cooldown has passed', async () => {
    vi.mocked(findVerificationTokenByIdentifier).mockResolvedValue(
      makeVerificationToken({ createdAt: subMinutes(new Date(), 6) }) as never,
    );

    expect(await checkRateLimit(EMAIL)).toEqual({ allowed: true });
  });

  it('fails open when the lookup throws', async () => {
    vi.mocked(findVerificationTokenByIdentifier).mockRejectedValue(new Error('db down'));

    expect(await checkRateLimit(EMAIL)).toEqual({ allowed: true });
  });
});
