import { describe, it, expect } from 'vitest';
import { classifyAuthError, isWrongPasswordError } from '@/lib/auth/auth-error';

describe('classifyAuthError', () => {
  it('treats a 403 INVALID_ORIGIN as an origin mismatch', () => {
    expect(classifyAuthError({ status: 403, code: 'INVALID_ORIGIN' })).toBe('originMismatch');
  });

  it('leaves other 403 codes to the form', () => {
    expect(classifyAuthError({ status: 403, code: 'MISSING_OR_NULL_ORIGIN' })).toBe('other');
    expect(classifyAuthError({ status: 403, code: 'CROSS_SITE_NAVIGATION_LOGIN_BLOCKED' })).toBe('other');
    expect(classifyAuthError({ status: 403, code: 'SIGNUP_DISABLED' })).toBe('other');
  });

  it('treats a 403 ACCOUNT_DISABLED as an account an admin disabled', () => {
    expect(classifyAuthError({ status: 403, code: 'ACCOUNT_DISABLED' })).toBe('accountDisabled');
  });

  it('treats a 429 ACCOUNT_TEMPORARILY_LOCKED as the two-factor lockout', () => {
    expect(classifyAuthError({ status: 429, code: 'ACCOUNT_TEMPORARILY_LOCKED' })).toBe('accountLocked');
  });

  it('treats any other 429 as rate limited', () => {
    expect(classifyAuthError({ status: 429 })).toBe('rateLimited');
    expect(classifyAuthError({ status: 429, code: 'TOO_MANY_REQUESTS' })).toBe('rateLimited');
  });

  it('leaves credential and server errors to the form', () => {
    expect(classifyAuthError({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe('other');
    expect(classifyAuthError({ status: 500 })).toBe('other');
  });

  it('requires the 403 status alongside the INVALID_ORIGIN code', () => {
    expect(classifyAuthError({ status: 400, code: 'INVALID_ORIGIN' })).toBe('other');
  });
});

describe('isWrongPasswordError', () => {
  it('treats INVALID_PASSWORD as a wrong password', () => {
    expect(isWrongPasswordError({ status: 400, code: 'INVALID_PASSWORD' })).toBe(true);
  });

  it("treats a password over better-auth's length limit as a wrong password", () => {
    expect(isWrongPasswordError({ status: 400, code: 'PASSWORD_TOO_LONG' })).toBe(true);
  });

  it('leaves other errors to the form', () => {
    expect(isWrongPasswordError({ status: 400, code: 'WEAK_PASSWORD' })).toBe(false);
    expect(isWrongPasswordError({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(false);
    expect(isWrongPasswordError({ status: 500 })).toBe(false);
  });
});
