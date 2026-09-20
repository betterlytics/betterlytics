import { describe, it, expect } from 'vitest';
import { createConcurrencyCap, type SlotResult } from './concurrency-cap';

function releaseOf(slot: SlotResult) {
  if ('refused' in slot) throw new Error(`expected a slot, got refused: ${slot.refused}`);
  return slot.release;
}

describe('createConcurrencyCap', () => {
  it('refuses a key past its per-key limit', () => {
    const acquire = createConcurrencyCap(2, 10);
    expect(acquire('a')).toHaveProperty('release');
    expect(acquire('a')).toHaveProperty('release');
    expect(acquire('a')).toEqual({ refused: 'key' });
    expect(acquire('b')).toHaveProperty('release');
  });

  it('refuses every key past the total limit', () => {
    const acquire = createConcurrencyCap(5, 2);
    expect(acquire('a')).toHaveProperty('release');
    expect(acquire('b')).toHaveProperty('release');
    expect(acquire('c')).toEqual({ refused: 'total' });
  });

  it('frees the slot on release', () => {
    const acquire = createConcurrencyCap(1, 1);
    const release = releaseOf(acquire('a'));
    expect(acquire('a')).toEqual({ refused: 'key' });
    release();
    expect(acquire('a')).toHaveProperty('release');
  });

  it('ignores a second release of the same slot', () => {
    const acquire = createConcurrencyCap(2, 2);
    const release = releaseOf(acquire('a'));
    acquire('a');
    release();
    release();
    expect(acquire('a')).toHaveProperty('release');
    expect(acquire('a')).toEqual({ refused: 'key' });
  });

  it('drops the key entry at zero so it can start fresh', () => {
    const acquire = createConcurrencyCap(1, 10);
    const release = releaseOf(acquire('a'));
    release();
    expect(acquire('a')).toHaveProperty('release');
    expect(acquire('a')).toEqual({ refused: 'key' });
  });
});
