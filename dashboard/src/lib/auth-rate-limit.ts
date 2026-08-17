// Per-account sign-in throttle. Attempts are cleared on successful session creation
// (see the session.create hook in better-auth.ts), so only sustained failures block.
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKED_KEYS = 10_000;
const MAX_EMAIL_LENGTH = 254;

const attempts = new Map<string, number[]>();

function keyFor(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const key = email.trim().toLowerCase();
  return key && key.length <= MAX_EMAIL_LENGTH ? key : null;
}

export type SignInAttemptResult = { allowed: true } | { allowed: false; retryAfterMs: number };

export function consumeSignInAttempt(email: unknown): SignInAttemptResult {
  const key = keyFor(email);
  if (!key) return { allowed: true };

  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (attempts.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= MAX_ATTEMPTS) {
    attempts.set(key, timestamps);
    return { allowed: false, retryAfterMs: timestamps[0]! + WINDOW_MS - now };
  }

  if (!attempts.has(key) && attempts.size >= MAX_TRACKED_KEYS) {
    attempts.delete(attempts.keys().next().value!);
  }
  timestamps.push(now);
  attempts.set(key, timestamps);
  return { allowed: true };
}

export function clearSignInAttempts(email: unknown): void {
  const key = keyFor(email);
  if (key) {
    attempts.delete(key);
  }
}
