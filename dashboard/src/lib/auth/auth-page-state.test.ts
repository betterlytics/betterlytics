import { describe, it, expect } from 'vitest';
import { SIGNUP_DISABLED_MESSAGE } from '@/constants/auth';
import {
  acceptInvitePath,
  inviteTokenFromCallback,
  resetLinkProblem,
  signInErrorKey,
  signInPath,
  signUpPath,
  twoFactorAttemptEnded,
  verifyEmailState,
} from '@/lib/auth/auth-page-state';

describe('signInPath and signUpPath', () => {
  it('carries a callbackUrl to sign-in, unless it is the default', () => {
    expect(signInPath('/accept-invite/tok')).toBe('/signin?callbackUrl=%2Faccept-invite%2Ftok');
    expect(signInPath('/dashboards')).toBe('/signin');
    expect(signInPath(undefined)).toBe('/signin');
  });

  it('carries an invitation to sign-up', () => {
    expect(signUpPath('tok')).toBe('/signup?invite=tok');
    expect(signUpPath(null)).toBe('/signup');
  });

  it('round-trips an invitation through sign-in', () => {
    const callbackUrl = decodeURIComponent(signInPath(acceptInvitePath('tok')).split('callbackUrl=')[1]);
    expect(signUpPath(inviteTokenFromCallback(callbackUrl))).toBe('/signup?invite=tok');
  });
});

describe('twoFactorAttemptEnded', () => {
  it("names why better-auth ended the attempt, and nothing for a code that's merely wrong", () => {
    expect(twoFactorAttemptEnded('TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE')).toBe('tooManyCodes');
    expect(twoFactorAttemptEnded('INVALID_TWO_FACTOR_COOKIE')).toBe('expired');
    expect(twoFactorAttemptEnded('INVALID_CODE')).toBeNull();
    expect(twoFactorAttemptEnded(undefined)).toBeNull();
  });
});

describe('inviteTokenFromCallback', () => {
  it('reads the token from an accept-invite path, with or without a locale', () => {
    expect(inviteTokenFromCallback('/accept-invite/abc123')).toBe('abc123');
    expect(inviteTokenFromCallback('/da/accept-invite/abc123')).toBe('abc123');
    expect(inviteTokenFromCallback(acceptInvitePath('tok'))).toBe('tok');
  });

  it.each([
    '/dashboards',
    '/accept-invite/',
    '/accept-invite/abc/extra',
    '/accept-invite/abc?x=1',
    '/x/accept-invite/abc',
  ])('ignores %s', (path) => {
    expect(inviteTokenFromCallback(path)).toBeNull();
  });
});

describe('resetLinkProblem', () => {
  it('lets a live token through', () => {
    expect(resetLinkProblem({ token: 't', tokenIsLive: true })).toBeNull();
  });

  it('treats an error from better-auth as expired, even with a token', () => {
    expect(resetLinkProblem({ token: 't', error: 'INVALID_TOKEN', tokenIsLive: true })).toBe('expired');
    expect(resetLinkProblem({ error: 'INVALID_TOKEN', tokenIsLive: false })).toBe('expired');
  });

  it('calls a missing token invalid and a stale one expired', () => {
    expect(resetLinkProblem({ tokenIsLive: false })).toBe('invalid');
    expect(resetLinkProblem({ token: 't', tokenIsLive: false })).toBe('expired');
  });
});

describe('verifyEmailState', () => {
  it('is verified on success', () => {
    expect(verifyEmailState({ verified: '1' })).toBe('verified');
  });

  it('lets an error win over verified', () => {
    expect(verifyEmailState({ verified: '1', error: 'TOKEN_EXPIRED' })).toBe('expired');
    expect(verifyEmailState({ verified: '1', error: 'INVALID_TOKEN' })).toBe('failed');
  });

  it('treats a legacy ?token= link as expired', () => {
    expect(verifyEmailState({ token: 'legacy' })).toBe('expired');
  });

  it('is invalid with nothing to go on', () => {
    expect(verifyEmailState({})).toBe('invalid');
  });
});

describe('signInErrorKey', () => {
  it('says nothing when there is no error or the visitor cancelled', () => {
    expect(signInErrorKey(undefined)).toBeNull();
    expect(signInErrorKey('')).toBeNull();
    expect(signInErrorKey('access_denied')).toBeNull();
  });

  it.each([
    ['account_not_linked', 'accountNotLinked'],
    ['signup_disabled', 'registrationDisabled'],
    ['SIGNUP_DISABLED', 'registrationDisabled'],
    [SIGNUP_DISABLED_MESSAGE.replaceAll(' ', '_'), 'registrationDisabled'],
    ['email_not_found', 'emailNotFound'],
    ['unable_to_link_account', 'unableToLink'],
    ['invalid_code', 'default'],
    ['something_new', 'default'],
  ] as const)('maps %s to %s', (error, key) => {
    expect(signInErrorKey(error)).toBe(key);
  });
});
