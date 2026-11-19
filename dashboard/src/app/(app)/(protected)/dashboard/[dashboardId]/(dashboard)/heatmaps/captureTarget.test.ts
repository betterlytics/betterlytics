import { describe, expect, it } from 'vitest';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { captureUrl, initialCaptureAddress, resolveCaptureTarget } from './captureTarget';

const base = { defaultOrigin: 'https://www.example.com', dashboardDomain: 'example.com' };

describe('resolveCaptureTarget', () => {
  it('opens a plain page path on the default origin', () => {
    expect(resolveCaptureTarget({ ...base, pagePath: '/pricing', address: '/pricing' })).toEqual({
      origin: 'https://www.example.com',
      capturePath: '/pricing',
    });
  });

  it('refuses a default origin off the dashboard domain', () => {
    expect(
      resolveCaptureTarget({
        ...base,
        defaultOrigin: 'https://attacker.test',
        pagePath: '/pricing',
        address: '/pricing',
      }),
    ).toEqual({ error: 'otherHost' });
  });

  it('takes a real page for a wildcard path and refuses one still holding a wildcard', () => {
    expect(
      resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', address: '/profile/betterlytics/posts' }),
    ).toEqual({
      origin: 'https://www.example.com',
      capturePath: '/profile/betterlytics/posts',
    });
    expect(resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', address: '/profile/*/posts' })).toEqual({
      error: 'wildcard',
    });
    expect(resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', address: '  ' })).toEqual({
      error: 'empty',
    });
  });

  it('takes a path with a query string when it is one of the grouped pages', () => {
    expect(
      resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', address: '/profile/a/posts?tab=new' }),
    ).toEqual({
      origin: 'https://www.example.com',
      capturePath: '/profile/a/posts?tab=new',
    });
    expect(resolveCaptureTarget({ ...base, pagePath: '/profile/*/posts', address: '/settings' })).toEqual({
      error: 'mismatch',
    });
  });

  it('takes a full address on the dashboard domain, with its own origin', () => {
    expect(
      resolveCaptureTarget({ ...base, pagePath: '/pricing', address: 'http://shop.example.com:8080/pricing' }),
    ).toEqual({ origin: 'http://shop.example.com:8080', capturePath: '/pricing' });
    expect(resolveCaptureTarget({ ...base, pagePath: '/pricing', address: 'https://evil.test/pricing' })).toEqual({
      error: 'otherHost',
    });
    expect(resolveCaptureTarget({ ...base, pagePath: '/pricing', address: 'javascript:alert(1)' })).toEqual({
      error: 'invalidUrl',
    });
  });
});

describe('initialCaptureAddress', () => {
  const capture = (capturedFromPath: string) => ({ capturedFromPath }) as HeatmapCapture;

  it('starts from the real page captured last, else the page path', () => {
    expect(
      initialCaptureAddress('/profile/*/posts', [capture('/profile/b/posts'), capture('/profile/a/posts')]),
    ).toBe('/profile/b/posts');
    expect(initialCaptureAddress('/profile/*/posts', [])).toBe('/profile/*/posts');
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
