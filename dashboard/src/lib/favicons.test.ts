import { describe, expect, it } from 'vitest';
import { getFaviconUrl, normalizeDomainForFavicon } from './favicons';

describe('normalizeDomainForFavicon', () => {
  it('returns null for empty input', () => {
    expect(normalizeDomainForFavicon(undefined)).toBeNull();
    expect(normalizeDomainForFavicon(null)).toBeNull();
    expect(normalizeDomainForFavicon('')).toBeNull();
  });

  it('strips protocol, www, path and casing', () => {
    expect(normalizeDomainForFavicon('  https://www.Example.com/path?q=1 ')).toBe('example.com');
  });

  it('keeps subdomains', () => {
    expect(normalizeDomainForFavicon('https://blog.example.co.uk')).toBe('blog.example.co.uk');
  });
});

describe('getFaviconUrl', () => {
  it('builds a proxy url for real domains', () => {
    expect(getFaviconUrl('example.com', true)).toBe('/api/favicons?domain=example.com');
    expect(getFaviconUrl('https://www.Example.com/dashboard', true)).toBe('/api/favicons?domain=example.com');
    expect(getFaviconUrl('blog.example.co.uk', true)).toBe('/api/favicons?domain=blog.example.co.uk');
  });

  it('returns null when favicon fetching is disabled', () => {
    expect(getFaviconUrl('example.com', false)).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(getFaviconUrl(undefined, true)).toBeNull();
    expect(getFaviconUrl(null, true)).toBeNull();
    expect(getFaviconUrl('   ', true)).toBeNull();
    expect(getFaviconUrl('https://www.', true)).toBeNull();
  });

  it('returns null for placeholder labels containing whitespace', () => {
    expect(getFaviconUrl('Demo Dashboard', true)).toBeNull();
    expect(getFaviconUrl('my site.com', true)).toBeNull();
  });

  it('returns null when there is no dot after normalization', () => {
    expect(getFaviconUrl('localhost', true)).toBeNull();
    expect(getFaviconUrl('Demo', true)).toBeNull();
  });
});
