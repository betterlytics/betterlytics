import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExpiringSet } from './expiring-set';

describe('ExpiringSet', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forgets a key once its ttl has passed', () => {
    const set = new ExpiringSet(1_000, 10);
    set.add('a');
    vi.advanceTimersByTime(999);
    expect(set.has('a')).toBe(true);
    vi.advanceTimersByTime(2);
    expect(set.has('a')).toBe(false);
  });

  it('evicts the oldest key past the cap and keeps re-added keys', () => {
    const set = new ExpiringSet(1_000, 2);
    set.add('a');
    set.add('b');
    set.add('a');
    set.add('c');
    expect(set.has('a')).toBe(true);
    expect(set.has('b')).toBe(false);
    expect(set.has('c')).toBe(true);
  });

  it('deletes a key on request', () => {
    const set = new ExpiringSet(1_000, 10);
    set.add('a');
    set.delete('a');
    expect(set.has('a')).toBe(false);
  });
});
