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

  it('resolves instagram to a sourced static file', () => {
    const def = resolveBrowser('Instagram');
    expect(def?.file).toBe('instagram.svg');
    expect(def?.source).toBe('logos/instagram-icon');
  });

  it('resolves QQ Browser Mobile to its own entry, not the plain QQ Browser rule', () => {
    expect(resolveBrowser('QQ Browser Mobile')?.label).toBe('QQ Browser Mobile');
    expect(resolveBrowser('QQ Browser')?.label).toBe('QQ Browser');
    expect(resolveBrowser('QQ Browser Mini')?.label).toBe('QQ Browser');
  });

  it('resolves the hand-maintained newcomers to their files', () => {
    expect(resolveBrowser('Whale')?.file).toBe('whale.svg');
    expect(resolveBrowser('Midori')?.file).toBe('midori.svg');
    expect(resolveBrowser('Aloha Browser')?.file).toBe('aloha.svg');
  });
});
