import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSlidingWindow, createSlidingWindowLimiter } from '@/lib/rate-limit';

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

describe('createSlidingWindow', () => {
  it('checks without recording, and records only when told to', () => {
    const slidingWindow = createSlidingWindow(WINDOW_MS, 2);

    expect(slidingWindow.retryAfterMs('a', 2)).toBe(0);
    expect(slidingWindow.retryAfterMs('a', 2)).toBe(0);

    slidingWindow.record('a', 2);
    expect(slidingWindow.retryAfterMs('a')).toBe(WINDOW_MS);
    expect(slidingWindow.retryAfterMs('b', 2)).toBe(0);
  });

  it('reports when enough slots are free for several requests', () => {
    const slidingWindow = createSlidingWindow(WINDOW_MS, 3);
    slidingWindow.record('a');
    vi.advanceTimersByTime(10_000);
    slidingWindow.record('a');
    vi.advanceTimersByTime(10_000);
    slidingWindow.record('a');

    // At 20s all three slots are taken, and two free up once the second request leaves at 70s.
    const retryAfterMs = slidingWindow.retryAfterMs('a', 2);
    expect(retryAfterMs).toBe(50_000);

    vi.advanceTimersByTime(retryAfterMs - 1);
    expect(slidingWindow.retryAfterMs('a', 2)).toBe(1);
    vi.advanceTimersByTime(1);
    expect(slidingWindow.retryAfterMs('a', 2)).toBe(0);
  });

  it('never fits more requests than the limit', () => {
    const slidingWindow = createSlidingWindow(WINDOW_MS, 2);

    expect(slidingWindow.retryAfterMs('a', 3)).toBe(Infinity);
  });
});
