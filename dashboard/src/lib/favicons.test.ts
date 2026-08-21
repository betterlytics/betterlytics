import { describe, it, expect } from 'vitest';
import { getFaviconUrl, normalizeDomainForFavicon } from './favicons';

describe('normalizeDomainForFavicon', () => {
  it('strips protocol, www and path', () => {
    expect(normalizeDomainForFavicon('https://www.Example.com/path')).toBe('example.com');
  });

  it('returns null for empty values', () => {
    expect(normalizeDomainForFavicon(undefined)).toBeNull();
    expect(normalizeDomainForFavicon(null)).toBeNull();
    expect(normalizeDomainForFavicon('')).toBeNull();
  });
});

describe('getFaviconUrl', () => {
  it('builds a proxy url when favicon fetching is enabled', () => {
    expect(getFaviconUrl('https://www.example.com/path', true)).toBe('/api/favicons?domain=example.com');
  });

  it('returns null when favicon fetching is disabled', () => {
    expect(getFaviconUrl('example.com', false)).toBeNull();
  });

  it('returns null without a domain', () => {
    expect(getFaviconUrl(undefined, true)).toBeNull();
  });
});
