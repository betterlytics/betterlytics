import * as OTPAuth from 'otpauth';
import * as bcrypt from 'bcrypt';
import { symmetricEncrypt } from '@/lib/crypto';
import type { User } from '@/entities/auth/user.entities';

/**
 * Test files must repeat this exact literal inside their `vi.mock('@/lib/env', ...)`
 * factory (mock factories are hoisted, so they can't reference this import).
 */
export const TEST_TOTP_ENCRYPTION_KEY = 'test-totp-encryption-key-32chars';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.com',
    role: 'admin',
    emailVerified: true,
    image: null,
    twoFactorEnabled: false,
    totpSecret: null,
    termsAcceptedVersion: 1,
    termsAcceptedAt: new Date('2024-01-01T00:00:00Z'),
    changelogVersionSeen: 'v0',
    onboardingCompletedAt: new Date('2024-01-02T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

/** Low cost factor to keep tests fast. */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 4);
}

export interface TotpEnrollment {
  secretBase32: string;
  /** The value stored in user.totpSecret. */
  encryptedSecret: string;
  currentCode: () => string;
  /** A 6-digit code guaranteed to differ from the currently-valid one. */
  wrongCode: () => string;
  /** The code valid at the given offset from now (e.g. -30_000 for the previous period). */
  codeAt: (offsetMs: number) => string;
}

export function makeTotpEnrollment(encryptionKey: string = TEST_TOTP_ENCRYPTION_KEY): TotpEnrollment {
  const secret = new OTPAuth.Secret();
  const totp = new OTPAuth.TOTP({ secret });
  const currentCode = () => totp.generate();

  return {
    secretBase32: secret.base32,
    encryptedSecret: symmetricEncrypt(secret.base32, encryptionKey),
    currentCode,
    wrongCode: () => String((Number(currentCode()) + 1) % 1_000_000).padStart(6, '0'),
    codeAt: (offsetMs: number) => totp.generate({ timestamp: Date.now() + offsetMs }),
  };
}
