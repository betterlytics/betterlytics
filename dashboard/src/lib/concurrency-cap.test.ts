import { describe, it, expect } from 'vitest';
import { createConcurrencyCap } from './concurrency-cap';

describe('createConcurrencyCap', () => {
  it('refuses a key past its per-key limit', () => {
    const acquire = createConcurrencyCap(2, 10);
    expect(acquire('a')).not.toBeNull();
    expect(acquire('a')).not.toBeNull();
    expect(acquire('a')).toBeNull();
    expect(acquire('b')).not.toBeNull();
  });

  it('refuses every key past the total limit', () => {
    const acquire = createConcurrencyCap(5, 2);
    expect(acquire('a')).not.toBeNull();
    expect(acquire('b')).not.toBeNull();
    expect(acquire('c')).toBeNull();
  });

  it('frees the slot on release', () => {
    const acquire = createConcurrencyCap(1, 1);
    const release = acquire('a')!;
    expect(acquire('a')).toBeNull();
    release();
    expect(acquire('a')).not.toBeNull();
  });

  it('ignores a second release of the same slot', () => {
    const acquire = createConcurrencyCap(2, 2);
    const release = acquire('a')!;
    acquire('a');
    release();
    release();
    expect(acquire('a')).not.toBeNull();
    expect(acquire('a')).toBeNull();
  });

  it('drops the key entry at zero so it can start fresh', () => {
    const acquire = createConcurrencyCap(1, 10);
    const release = acquire('a')!;
    release();
    const again = acquire('a');
    expect(again).not.toBeNull();
    expect(acquire('a')).toBeNull();
  });
});
