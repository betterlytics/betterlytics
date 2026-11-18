import { describe, expect, it } from 'vitest';
import { captureUrl, resolveCaptureTarget, wildcardValues } from './captureTarget';

const base = { defaultOrigin: 'https://www.example.com', dashboardDomain: 'example.com', customUrl: null };

describe('resolveCaptureTarget', () => {
  it('opens a plain page path on the default origin', () => {
    expect(resolveCaptureTarget({ ...base, pagePath: '/pricing', values: [] })).toEqual({
      origin: 'https://www.example.com',
      capturePath: '/pricing',
    });
  });

  it('fills in wildcards and refuses an empty one before anything opens', () => {
    expect(resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', values: ['betterlytics'] })).toEqual({
      origin: 'https://www.example.com',
      capturePath: '/profile/betterlytics/posts',
    });
    expect(resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', values: [' '] })).toEqual({ error: 'empty' });
  });

  it('takes a different path with a query string when it is one of the grouped pages', () => {
    expect(
      resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', values: [], customUrl: '/profile/a/posts?tab=new' }),
    ).toEqual({ origin: 'https://www.example.com', capturePath: '/profile/a/posts?tab=new' });
    expect(resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', values: [], customUrl: '/settings' })).toEqual({
      error: 'mismatch',
    });
  });

  it('takes a full address on the dashboard domain, with its own origin', () => {
    expect(
      resolveCaptureTarget({ ...base, pagePath: '/pricing', values: [], customUrl: 'http://shop.example.com:8080/pricing' }),
    ).toEqual({ origin: 'http://shop.example.com:8080', capturePath: '/pricing' });
    expect(
      resolveCaptureTarget({ ...base, pagePath: '/pricing', values: [], customUrl: 'https://evil.test/pricing' }),
    ).toEqual({ error: 'otherHost' });
    expect(resolveCaptureTarget({ ...base, pagePath: '/pricing', values: [], customUrl: 'javascript:alert(1)' })).toEqual({
      error: 'invalidUrl',
    });
  });
});

describe('wildcardValues', () => {
  it('reads the wildcard values back from a real page', () => {
    expect(wildcardValues('/profile/*/posts', '/profile/betterlytics/posts')).toEqual(['betterlytics']);
    expect(wildcardValues('/profile/*/posts', '/settings')).toEqual(['']);
    expect(wildcardValues('/pricing', '/pricing')).toEqual([]);
  });
});

describe('captureUrl', () => {
  it('puts the token in the fragment, with the hide-text flag', () => {
    const target = { origin: 'https://www.example.com', capturePath: '/pricing?plan=pro' };
    expect(captureUrl(target, 'bhc_abc', false)).toBe('https://www.example.com/pricing?plan=pro#bl-capture=bhc_abc');
    expect(captureUrl(target, 'bhc_abc', true)).toBe(
      'https://www.example.com/pricing?plan=pro#bl-capture=bhc_abc&bl-hide-text=1',
    );
  });
});
