import { describe, expect, it } from 'vitest';
import { BROWSERS, resolveBrowser } from './browserIcons';

describe('resolveBrowser', () => {
  it('resolves chrome to a sourced static file', () => {
    const def = resolveBrowser('Google Chrome');
    expect(def?.file).toBe('chrome.svg');
    expect(def?.source).toBe('logos/chrome');
  });

  it('resolves samsung internet to its hand-maintained file', () => {
    const def = resolveBrowser('Samsung Internet');
    expect(def?.file).toBe('samsunginternet.svg');
    expect(def?.source).toBeUndefined();
  });

  it('returns null for arc until its icon is added', () => {
    expect(resolveBrowser('Arc')).toBeNull();
  });

  it('returns null for unknown browsers', () => {
    expect(resolveBrowser('NetPositive')).toBeNull();
  });

  it('gives every entry an svg filename', () => {
    for (const def of Object.values(BROWSERS)) {
      expect(def.file).toMatch(/\.svg$/);
    }
  });
});
