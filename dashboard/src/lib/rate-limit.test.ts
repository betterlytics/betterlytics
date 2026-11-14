import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSlidingWindowLimiter } from '@/lib/rate-limit';

const WINDOW_MS = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSlidingWindowLimiter', () => {
  it('records each allowed request and reports when the oldest one leaves the window', () => {
    const check = createSlidingWindowLimiter(WINDOW_MS, 2);

    expect(check('a')).toEqual({ allowed: true, retryAfterMs: 0 });
    vi.advanceTimersByTime(10_000);
    expect(check('a')).toEqual({ allowed: true, retryAfterMs: 0 });
    vi.advanceTimersByTime(10_000);

    expect(check('a')).toEqual({ allowed: false, retryAfterMs: 40_000 });
    expect(check('b').allowed).toBe(true);

    vi.advanceTimersByTime(40_000);
    expect(check('a').allowed).toBe(true);
    expect(check('a').allowed).toBe(false);
  });
});
