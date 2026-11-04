import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAllOrNothingLimiter, createSlidingWindowLimiter } from '@/lib/rate-limit';

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

describe('createAllOrNothingLimiter', () => {
  it('records every key when all of them fit', () => {
    const check = createAllOrNothingLimiter(WINDOW_MS, 1);

    expect(check(['a', 'b'])).toEqual({ allowed: true, retryAfterMs: 0 });

    expect(check(['a']).allowed).toBe(false);
    expect(check(['b']).allowed).toBe(false);
  });

  it('records no key when one of them is over its limit', () => {
    const check = createAllOrNothingLimiter(WINDOW_MS, 1);
    check(['full']);

    expect(check(['free', 'full']).allowed).toBe(false);

    expect(check(['free']).allowed).toBe(true);
  });

  it('counts a repeated key once per occurrence and records nothing when they do not all fit', () => {
    const check = createAllOrNothingLimiter(WINDOW_MS, 3);
    check(['a', 'a']);

    expect(check(['a', 'a']).allowed).toBe(false);

    expect(check(['a']).allowed).toBe(true);
    expect(check(['a']).allowed).toBe(false);
  });

  it('reports when enough slots are free for the repeated key', () => {
    const check = createAllOrNothingLimiter(WINDOW_MS, 3);
    check(['a']);
    vi.advanceTimersByTime(10_000);
    check(['a']);
    vi.advanceTimersByTime(10_000);
    check(['a']);

    // At 20s all three slots are taken, and two free up once the second request leaves at 70s.
    const { retryAfterMs } = check(['a', 'a']);
    expect(retryAfterMs).toBe(50_000);

    vi.advanceTimersByTime(retryAfterMs - 1);
    expect(check(['a', 'a']).allowed).toBe(false);
    vi.advanceTimersByTime(1);
    expect(check(['a', 'a']).allowed).toBe(true);
  });

  it('reports the key that takes longest to free up', () => {
    const check = createAllOrNothingLimiter(WINDOW_MS, 1);
    check(['early']);
    vi.advanceTimersByTime(30_000);
    check(['late']);

    expect(check(['early', 'late'])).toEqual({ allowed: false, retryAfterMs: 60_000 });
  });

  it('rejects more requests than the limit without recording them, reporting a whole window', () => {
    const check = createAllOrNothingLimiter(WINDOW_MS, 2);

    expect(check(['a', 'a', 'a'])).toEqual({ allowed: false, retryAfterMs: WINDOW_MS });

    expect(check(['a', 'a']).allowed).toBe(true);
  });
});
