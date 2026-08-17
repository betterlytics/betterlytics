import { createSlidingWindowLimiter } from '@/lib/rate-limit';

// Per-email throttle for credential sign-in, complementing better-auth's built-in
// per-IP limits (3/10s on /sign-in/* in production): an attacker rotating IPs still
// gets at most this many attempts against a single account. Counts attempts, not
// failures, so keep it loose enough for a legitimate user retrying a password.
const SIGN_IN_WINDOW_MS = 10 * 60_000;
const SIGN_IN_MAX_ATTEMPTS = 10;

const signInEmailLimiter = createSlidingWindowLimiter(SIGN_IN_WINDOW_MS, SIGN_IN_MAX_ATTEMPTS);

export function checkSignInEmailRateLimit(email: string) {
  return signInEmailLimiter(email.trim().toLowerCase());
}
