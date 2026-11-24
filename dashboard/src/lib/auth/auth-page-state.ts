/* What the auth pages decide from their URLs, kept pure so the pages stay thin and the rules are tested. */
import { SIGNUP_DISABLED_MESSAGE } from '@/constants/auth';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import { ACCOUNT_DISABLED_ERROR_CODE } from './auth-error';
import { toSafeRelativePath } from './safe-redirect';

// the smart entry: the user's only dashboard, else Your Dashboards
const SIGN_IN_REDIRECT_DEFAULT = '/dashboard';
const LOCALE_PREFIX = `(?:/(?:${SUPPORTED_LANGUAGES.join('|')}))?`;
const ACCEPT_INVITE_PATH = new RegExp(`^${LOCALE_PREFIX}/accept-invite/([^/?#]+)$`);
const SIGNED_OUT_PAGE = new RegExp(`^${LOCALE_PREFIX}/(?:signin|signup|forgot-password|reset-password)/?$`);

/**
 * The callbackUrl when it is a path on this site, else the default. Never a page only for the signed out, which would
 * bounce the visitor on (or, for sign-in itself, loop). Decoded first, as the router does: /%73ignin is sign-in too.
 */
export function signInRedirectPath(callbackUrl: unknown): string {
  const target = toSafeRelativePath(callbackUrl, SIGN_IN_REDIRECT_DEFAULT);
  try {
    const { pathname } = new URL(target, 'http://placeholder.invalid');
    return SIGNED_OUT_PAGE.test(decodeURIComponent(pathname)) ? SIGN_IN_REDIRECT_DEFAULT : target;
  } catch {
    return SIGN_IN_REDIRECT_DEFAULT;
  }
}

export function acceptInvitePath(token: string): string {
  return `/accept-invite/${token}`;
}

export function inviteTokenFromCallback(callbackUrl: string): string | null {
  return ACCEPT_INVITE_PATH.exec(callbackUrl)?.[1] ?? null;
}

/**
 * A pending MCP authorization (`oauthQuery`, the signed query the OAuth provider sent to sign-in) rides along in the
 * page's own query, where the provider's client reads it on sign-in, so it takes the place of a callbackUrl.
 */
export function signInPath(callbackUrl?: string, oauthQuery?: string | null): string {
  if (oauthQuery) return `/signin?${oauthQuery}`;
  return callbackUrl && callbackUrl !== SIGN_IN_REDIRECT_DEFAULT
    ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/signin';
}

export function signUpPath(inviteToken?: string | null, oauthQuery?: string | null): string {
  const query = [oauthQuery, inviteToken && `invite=${encodeURIComponent(inviteToken)}`].filter(Boolean).join('&');
  return query ? `/signup?${query}` : '/signup';
}

/**
 * Signing in or up on behalf of an MCP client's authorization request continues it: better-auth answers with the
 * next page (consent, or back to the client) and its client is already on the way there.
 */
export function continuesAuthorization(data: unknown): boolean {
  const next = data as { redirect?: unknown; url?: unknown } | null;
  return next?.redirect === true && typeof next.url === 'string';
}

export type ResetLinkProblem = 'invalid' | 'expired';

/**
 * Null when the link is usable. better-auth's emailed link checks the token first and lands here with `?token=` or
 * `?error=INVALID_TOKEN`; a token that is no longer stored has expired.
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
 * better-auth ends a second-factor attempt after five wrong codes or when its cookie lapses; only a fresh password
 * sign-in starts a new one.
 */
export function twoFactorAttemptEnded(code: string | undefined): 'tooManyCodes' | 'expired' | null {
  if (code === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE') return 'tooManyCodes';
  if (code === 'INVALID_TWO_FACTOR_COOKIE') return 'expired';
  return null;
}

export type SignInErrorKey =
  'accountNotLinked' | 'registrationDisabled' | 'emailNotFound' | 'unableToLink' | 'accountDisabled' | 'default';

const SIGNUP_DISABLED_ERROR = SIGNUP_DISABLED_MESSAGE.replaceAll(' ', '_');

/** For an OAuth sign-in or sign-up that came back with `?error=`; null when the visitor cancelled at the provider. */
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
    case ACCOUNT_DISABLED_ERROR_CODE:
      return 'accountDisabled';
    default:
      return 'default';
  }
}
