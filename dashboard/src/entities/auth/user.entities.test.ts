/**
 * Characterization tests for the auth entity schemas (internal issue #50).
 *
 * Pins the validation contract the better-auth migration must preserve:
 * password policy and registration requirements. (The login payload moved to
 * better-auth's own sign-in endpoint, so LoginUserSchema is gone.)
 */
import { describe, it, expect } from 'vitest';
import { PasswordSchema } from '@/entities/auth/password.entities';
import { RegisterUserSchema } from '@/entities/auth/user.entities';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';

describe('PasswordSchema (password policy)', () => {
  it.each([
    ['Abcdefgh', true, 'minimum length with mixed case'],
    ['Abcdefg', false, 'too short (7 chars)'],
    ['abcdefgh', false, 'no uppercase letter'],
    ['ABCDEFGH', false, 'no lowercase letter'],
    ['Abcdefgh1', true, 'digits allowed but not required'],
    ['Ab' + 'c'.repeat(98), true, 'exactly 100 chars'],
    ['Ab' + 'c'.repeat(99), false, 'over 100 chars'],
  ])('%s → valid: %s (%s)', (password, valid) => {
    expect(PasswordSchema.safeParse(password).success).toBe(valid);
  });
});

describe('RegisterUserSchema', () => {
  const valid = {
    email: 'new@example.com',
    name: 'New User',
    password: 'Valid-password-1',
    acceptedTerms: true,
    language: 'en',
  };

  it('requires terms to be accepted', () => {
    const result = RegisterUserSchema.safeParse({ ...valid, acceptedTerms: false });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid email and one longer than 254 chars', () => {
    expect(RegisterUserSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
    expect(
      RegisterUserSchema.safeParse({ ...valid, email: `${'a'.repeat(250)}@example.com` }).success,
    ).toBe(false);
  });

  it('enforces the password policy on registration', () => {
    expect(RegisterUserSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false);
  });

  it('falls back to English for unsupported languages instead of rejecting', () => {
    const result = RegisterUserSchema.parse({ ...valid, language: 'xx' });

    expect(result.language).toBe('en');
  });

  it('keeps a supported non-English language', () => {
    const other = SUPPORTED_LANGUAGES.find((lang) => lang !== 'en');
    if (!other) return; // only meaningful when more than one language is supported

    expect(RegisterUserSchema.parse({ ...valid, language: other }).language).toBe(other);
  });
});
