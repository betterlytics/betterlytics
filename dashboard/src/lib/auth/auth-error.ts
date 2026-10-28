// Structural subset of better-auth's client error ({ code?, message?, status, statusText }).
export type AuthClientError = { code?: string; status: number };

export type AuthErrorKind = 'originMismatch' | 'accountLocked' | 'accountDisabled' | 'rateLimited' | 'other';

// Thrown by our session create hook for accounts an admin disabled; OAuth sign-ins get it as ?error=
export const ACCOUNT_DISABLED_ERROR_CODE = 'ACCOUNT_DISABLED';

// better-auth rejects a password over maxPasswordLength before checking it; no stored password is that long,
// so the forms treat it as a wrong password
export const PASSWORD_TOO_LONG_ERROR_CODE = 'PASSWORD_TOO_LONG';

/**
 * Classifies by status and code only: better-auth's messages are English library text that can
 * change between releases.
 */
export function classifyAuthError(error: AuthClientError): AuthErrorKind {
  // originCheckMiddleware / formCsrfMiddleware throw FORBIDDEN with BASE_ERROR_CODES.INVALID_ORIGIN
  if (error.status === 403 && error.code === 'INVALID_ORIGIN') return 'originMismatch';
  if (error.status === 403 && error.code === ACCOUNT_DISABLED_ERROR_CODE) return 'accountDisabled';
  // The two-factor plugin locks sign-in for 15 minutes after 10 wrong codes, so "wait a moment" would mislead
  if (error.status === 429 && error.code === 'ACCOUNT_TEMPORARILY_LOCKED') return 'accountLocked';
  // The rate limiter answers a bare 429 without a code
  if (error.status === 429) return 'rateLimited';
  return 'other';
}
