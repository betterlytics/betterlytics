import { describe, expect, it } from 'vitest';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { captureUrl, captureWindowFeatures, initialCaptureAddress, resolveCaptureAddress } from './captureTarget';

const origin = 'https://www.example.com';

describe('resolveCaptureAddress', () => {
  it('opens a full address on any host, without its fragment', () => {
    expect(resolveCaptureAddress('https://staging.example.net/checkout?step=2#top', origin)).toEqual({
      url: 'https://staging.example.net/checkout?step=2',
    });
    expect(resolveCaptureAddress('  http://localhost:3000/cart ', origin)).toEqual({
      url: 'http://localhost:3000/cart',
    });
  });

  it('opens a path on the suggested origin', () => {
    expect(resolveCaptureAddress('/pricing', origin)).toEqual({ url: 'https://www.example.com/pricing' });
    expect(resolveCaptureAddress('/pricing', undefined)).toEqual({ error: 'invalidUrl' });
  });

  it('refuses a wildcard left in the path, but takes one in the query string', () => {
    expect(resolveCaptureAddress('https://www.example.com/profile/*/posts', origin)).toEqual({ error: 'wildcard' });
    expect(resolveCaptureAddress('/profile/*/posts', origin)).toEqual({ error: 'wildcard' });
    expect(resolveCaptureAddress('https://www.example.com/search?test=*', origin)).toEqual({
      url: 'https://www.example.com/search?test=*',
    });
    expect(resolveCaptureAddress('https://www.example.com/page#*', origin)).toEqual({
      url: 'https://www.example.com/page',
    });
  });

  it.each(['', '   '])('asks for an address when given %j', (address) => {
    expect(resolveCaptureAddress(address, origin)).toEqual({ error: 'empty' });
  });

  it.each(['javascript:alert(1)', 'example.com/pricing', 'localhost:3000/cart', '//evil.test/x', 'ftp://example.com/'])(
    'refuses %s',
    (address) => {
      expect(resolveCaptureAddress(address, origin)).toEqual({ error: 'invalidUrl' });
    },
  );
});

describe('initialCaptureAddress', () => {
  const capture = (capturedFromUrl: string) => ({ capturedFromUrl }) as HeatmapCapture;

  const site = { origin, domain: 'example.com' };

  it("starts from the page captured last on the dashboard's domain, else the page path on the suggested origin", () => {
    expect(
      initialCaptureAddress('/profile/*/posts', site, [
        capture('https://shop.example.com/profile/b/posts'),
        capture('https://www.example.com/profile/a/posts'),
      ]),
    ).toBe('https://shop.example.com/profile/b/posts');
    expect(initialCaptureAddress('/profile/*/posts', site, [])).toBe('https://www.example.com/profile/*/posts');
    expect(initialCaptureAddress('/profile/*/posts', undefined, [])).toBeNull();
    expect(initialCaptureAddress('/profile/*/posts', null, [])).toBeNull();
  });

  it('skips captures of pages off the domain, which any link holder could have uploaded', () => {
    expect(
      initialCaptureAddress('/profile/*/posts', site, [
        capture('https://evil.test/profile/b/posts'),
        capture('https://example.com.evil.test/profile/b/posts'),
        capture('https://www.example.com/profile/a/posts'),
      ]),
    ).toBe('https://www.example.com/profile/a/posts');
    expect(initialCaptureAddress('/pricing', site, [capture('http://localhost:3000/pricing')])).toBe(
      'https://www.example.com/pricing',
    );
  });
});

describe('captureUrl', () => {
  it('puts the token and the page path in the fragment, with the hide-text flag', () => {
    const url = 'https://www.example.com/pricing?plan=pro';
    expect(captureUrl(url, 'bhc_abc', '/pricing', false)).toBe(
      'https://www.example.com/pricing?plan=pro#bl-capture=bhc_abc&bl-page=%2Fpricing',
    );
    const withWildcard = captureUrl(url, 'bhc_abc', '/profile/*/posts', true);
    const fragment = new URLSearchParams(withWildcard.split('#')[1]);
    expect(withWildcard.indexOf('#bl-capture=')).toBeGreaterThan(0);
    expect(Object.fromEntries(fragment)).toEqual({
      'bl-capture': 'bhc_abc',
      'bl-page': '/profile/*/posts',
      'bl-hide-text': '1',
    });
  });
});

describe('captureWindowFeatures', () => {
  const laptop = { availWidth: 1536, availHeight: 816, availLeft: 0, availTop: 0 };

  it('opens tablet and mobile in a window of their width', () => {
    expect(captureWindowFeatures('tablet', laptop)).toBe('popup,width=768,height=1024');
    expect(captureWindowFeatures('mobile', laptop)).toBe('popup,width=390,height=844');
  });

  it("fills the editor's screen on desktop", () => {
    expect(captureWindowFeatures('desktop', laptop)).toBe('popup,width=1536,height=816,left=0,top=0');
  });

  it('stops at 1920 by 1080 on larger screens, on the screen the dashboard is on', () => {
    const monitor = { availWidth: 2560, availHeight: 1400, availLeft: 1536, availTop: -200 };
    expect(captureWindowFeatures('desktop', monitor)).toBe('popup,width=1920,height=1080,left=1536,top=-200');
  });
});
