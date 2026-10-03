// Structural subset of better-auth's client error ({ code?, message?, status, statusText }).
export type AuthClientError = { code?: string; status: number };

export type AuthErrorKind = 'originMismatch' | 'accountLocked' | 'rateLimited' | 'other';

/**
 * Classifies by status and code only: better-auth's messages are English library text that can
 * change between releases.
 */
export function classifyAuthError(error: AuthClientError): AuthErrorKind {
  // originCheckMiddleware / formCsrfMiddleware throw FORBIDDEN with BASE_ERROR_CODES.INVALID_ORIGIN
  if (error.status === 403 && error.code === 'INVALID_ORIGIN') return 'originMismatch';
  // The two-factor plugin locks sign-in for 15 minutes after 10 wrong codes, so "wait a moment" would mislead
  if (error.status === 429 && error.code === 'ACCOUNT_TEMPORARILY_LOCKED') return 'accountLocked';
  // The rate limiter answers a bare 429 without a code
  if (error.status === 429) return 'rateLimited';
  return 'other';
}
