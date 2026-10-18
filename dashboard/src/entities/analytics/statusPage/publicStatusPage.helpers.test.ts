import { describe, it, expect } from 'vitest';
import { isStatusPageNoindex } from './publicStatusPage.helpers';

describe('isStatusPageNoindex', () => {
  it('noindexes a self-hosted public page unless the instance allows crawling', () => {
    expect(isStatusPageNoindex('public', false, false)).toBe(true);
    expect(isStatusPageNoindex('public', false, true)).toBe(false);
  });

  it('indexes a Cloud public page', () => {
    expect(isStatusPageNoindex('public', true, false)).toBe(false);
    expect(isStatusPageNoindex('public', true, true)).toBe(false);
  });

  it('always noindexes an unlisted page', () => {
    expect(isStatusPageNoindex('unlisted', true, true)).toBe(true);
    expect(isStatusPageNoindex('unlisted', false, true)).toBe(true);
    expect(isStatusPageNoindex('unlisted', false, false)).toBe(true);
  });
});
