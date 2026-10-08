/*
 * The choices the auth pages make from their URLs: which state to show, which message, and how an invitation is
 * carried between sign-in and sign-up. Pure, so the pages stay thin and the rules are tested.
 */
import { SIGN_IN_REDIRECT_DEFAULT, SIGNUP_DISABLED_MESSAGE } from '@/constants/auth';

const ACCEPT_INVITE_PATH = /^(?:\/[a-z]{2})?\/accept-invite\/([^/?#]+)$/;

/** Where an invitation is accepted; sign-in returns there once the invitee has an account. */
export function acceptInvitePath(token: string): string {
  return `/accept-invite/${token}`;
}

/** The invitation token in a callbackUrl that points at its accept page, so sign-up can carry the invite on. */
export function inviteTokenFromCallback(callbackUrl: string): string | null {
  return ACCEPT_INVITE_PATH.exec(callbackUrl)?.[1] ?? null;
}

/** Sign-in, returning afterwards to `callbackUrl` unless that is where it goes anyway. */
export function signInPath(callbackUrl?: string): string {
  return callbackUrl && callbackUrl !== SIGN_IN_REDIRECT_DEFAULT
    ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/signin';
}

/** Sign-up, carrying an invitation when there is one. */
export function signUpPath(inviteToken?: string | null): string {
  return inviteToken ? `/signup?invite=${encodeURIComponent(inviteToken)}` : '/signup';
}

export type ResetLinkProblem = 'invalid' | 'expired';

/**
 * Why a reset link can't be used, or null when it can. better-auth's emailed link checks the token first and lands
 * here with `?token=` or `?error=INVALID_TOKEN`; a token that is no longer stored has expired.
 */
export function resetLinkProblem({
  token,
  error,
  tokenIsLive,
}: {
  token?: string;
  error?: string;
  tokenIsLive: boolean;
}): ResetLinkProblem | null {
  if (error) return 'expired';
  if (!token) return 'invalid';
  return tokenIsLive ? null : 'expired';
}

export type VerifyEmailState = 'verified' | 'expired' | 'failed' | 'invalid';

/**
 * better-auth's emailed link verifies the token server-side and redirects to verify-email: success with
 * `?verified=1`, failure with `?verified=1&error=<code>`, so an error wins over verified. Links from before the
 * better-auth migration arrive with `?token=` and are treated as expired.
 */
export function verifyEmailState({
  token,
  error,
  verified,
}: {
  token?: string;
  error?: string;
  verified?: string;
}): VerifyEmailState {
  if (error === 'TOKEN_EXPIRED' || (!error && token)) return 'expired';
  if (error) return 'failed';
  if (verified) return 'verified';
  return 'invalid';
}

/**
 * Whether better-auth has ended a second-factor attempt, and why; only a fresh password sign-in starts a new one.
 * It counts wrong codes per attempt (and stops checking codes after five), and the attempt's cookie lapses.
 */
export function twoFactorAttemptEnded(code: string | undefined): 'tooManyCodes' | 'expired' | null {
  if (code === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE') return 'tooManyCodes';
  if (code === 'INVALID_TWO_FACTOR_COOKIE') return 'expired';
  return null;
}

export type SignInErrorKey =
  'accountNotLinked' | 'registrationDisabled' | 'emailNotFound' | 'unableToLink' | 'default';

const SIGNUP_DISABLED_ERROR = SIGNUP_DISABLED_MESSAGE.replaceAll(' ', '_');

/**
 * The message for an OAuth sign-in or sign-up that came back to /signin with `?error=`, or null when there is
 * nothing to say: the visitor cancelled at the provider.
 */
export function signInErrorKey(error: string | undefined): SignInErrorKey | null {
  switch (error) {
    case undefined:
    case '':
    case 'access_denied':
      return null;
    case 'account_not_linked':
      return 'accountNotLinked';
    // our sign-up gate's refusal arrives as its message (better-auth's callback), or as better-auth's own code
    case SIGNUP_DISABLED_ERROR:
    case 'signup_disabled':
    case 'SIGNUP_DISABLED':
      return 'registrationDisabled';
    // GitHub with no public or verified email
    case 'email_not_found':
      return 'emailNotFound';
    case 'unable_to_link_account':
      return 'unableToLink';
    default:
      return 'default';
  }
}
