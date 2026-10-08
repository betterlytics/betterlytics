/*
 * The choices the auth pages make from their URLs: which state to show, which message, and how an invitation is
 * carried between sign-in and sign-up. Pure, so the pages stay thin and the rules are tested.
 */

const ACCEPT_INVITE_PATH = /^(?:\/[a-z]{2})?\/accept-invite\/([^/?#]+)$/;

/** Where an invitation is accepted; sign-in returns there once the invitee has an account. */
export function acceptInvitePath(token: string): string {
  return `/accept-invite/${token}`;
}

/** The invitation token in a callbackUrl that points at its accept page, so sign-up can carry the invite on. */
export function inviteTokenFromCallback(callbackUrl: string): string | null {
  return ACCEPT_INVITE_PATH.exec(callbackUrl)?.[1] ?? null;
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

export type SignInErrorKey =
  'accountNotLinked' | 'registrationDisabled' | 'emailNotFound' | 'unableToLink' | 'default';

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
    // our sign-up gate's refusal arrives as its message, spaces turned to underscores (better-auth's callback)
    case 'signup_disabled':
    case 'SIGNUP_DISABLED':
    case 'Registration_is_disabled_on_this_instance':
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
