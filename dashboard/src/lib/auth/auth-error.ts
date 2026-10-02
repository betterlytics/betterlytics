// Structural subset of better-auth's client error ({ code?, message?, status, statusText }).
export type AuthClientError = { code?: string; status: number };

export type AuthErrorKind = 'originMismatch' | 'rateLimited' | 'other';

/**
 * Classifies by status and code only: better-auth's messages are English library text that can
 * change between releases.
 */
export function classifyAuthError(error: AuthClientError): AuthErrorKind {
  // originCheckMiddleware / formCsrfMiddleware throw FORBIDDEN with BASE_ERROR_CODES.INVALID_ORIGIN
  if (error.status === 403 && error.code === 'INVALID_ORIGIN') return 'originMismatch';
  // The rate limiter answers a bare 429 without a code; the 2FA lockout is 429 ACCOUNT_TEMPORARILY_LOCKED
  if (error.status === 429) return 'rateLimited';
  return 'other';
}
