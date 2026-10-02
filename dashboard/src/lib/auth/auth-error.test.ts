import { describe, it, expect } from 'vitest';
import { classifyAuthError } from '@/lib/auth/auth-error';

describe('classifyAuthError', () => {
  it('treats a 403 INVALID_ORIGIN as an origin mismatch', () => {
    expect(classifyAuthError({ status: 403, code: 'INVALID_ORIGIN' })).toBe('originMismatch');
  });

  it('leaves other 403 codes to the form', () => {
    expect(classifyAuthError({ status: 403, code: 'MISSING_OR_NULL_ORIGIN' })).toBe('other');
    expect(classifyAuthError({ status: 403, code: 'CROSS_SITE_NAVIGATION_LOGIN_BLOCKED' })).toBe('other');
    expect(classifyAuthError({ status: 403, code: 'SIGNUP_DISABLED' })).toBe('other');
  });

  it('treats any 429 as rate limited, with or without a code', () => {
    expect(classifyAuthError({ status: 429 })).toBe('rateLimited');
    expect(classifyAuthError({ status: 429, code: 'ACCOUNT_TEMPORARILY_LOCKED' })).toBe('rateLimited');
  });

  it('leaves credential and server errors to the form', () => {
    expect(classifyAuthError({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe('other');
    expect(classifyAuthError({ status: 500 })).toBe('other');
  });

  it('requires the 403 status alongside the INVALID_ORIGIN code', () => {
    expect(classifyAuthError({ status: 400, code: 'INVALID_ORIGIN' })).toBe('other');
  });
});
