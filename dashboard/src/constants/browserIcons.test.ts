import { readFileSync } from 'node:fs';
import path from 'node:path';
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

  it('resolves arc to a sourced static file', () => {
    const def = resolveBrowser('Arc');
    expect(def?.file).toBe('arc.svg');
    expect(def?.source).toBe('logos/arc');
  });

  it('returns null for unknown browsers', () => {
    expect(resolveBrowser('NetPositive')).toBeNull();
  });

  it('gives every entry an svg filename', () => {
    for (const def of Object.values(BROWSERS)) {
      expect(def.file).toMatch(/\.svg$/);
    }
  });

  it('has a committed SVG whose artwork matches the mono flag for every entry', () => {
    for (const def of Object.values(BROWSERS)) {
      const svg = readFileSync(path.join('public', 'browser-icons', def.file), 'utf8');
      expect(svg.includes('currentColor')).toBe(Boolean(def.mono));
    }
  });
});
