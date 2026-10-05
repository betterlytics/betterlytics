import { describe, expect, it } from 'vitest';
import { replaceSearchParam } from './use-replace-state-param';

describe('replaceSearchParam', () => {
  it('adds the key while keeping other params', () => {
    expect(replaceSearchParam('?interval=7d', 'country', 'DK')).toBe('?interval=7d&country=DK');
  });

  it('replaces an existing value', () => {
    expect(replaceSearchParam('?country=DK&interval=7d', 'country', 'US')).toBe('?country=US&interval=7d');
  });

  it('removes the key and drops the question mark when nothing is left', () => {
    expect(replaceSearchParam('?country=DK&interval=7d', 'country', undefined)).toBe('?interval=7d');
    expect(replaceSearchParam('?country=DK', 'country', undefined)).toBe('');
  });

  it('returns null when the URL already matches', () => {
    expect(replaceSearchParam('?country=DK', 'country', 'DK')).toBeNull();
    expect(replaceSearchParam('?interval=7d', 'country', undefined)).toBeNull();
    expect(replaceSearchParam('', 'country', '')).toBeNull();
  });
});
