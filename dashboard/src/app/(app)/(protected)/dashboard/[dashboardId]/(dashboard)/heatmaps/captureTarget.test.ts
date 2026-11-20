import { describe, expect, it } from 'vitest';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import {
  captureUrl,
  captureWindowFeatures,
  hasPathWildcard,
  initialCaptureAddress,
  resolveCaptureAddress,
} from './captureTarget';

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

describe('hasPathWildcard', () => {
  it('looks only at the path', () => {
    expect(hasPathWildcard('https://www.example.com/profile/*/posts')).toBe(true);
    expect(hasPathWildcard('/profile/*/posts?tab=new')).toBe(true);
    expect(hasPathWildcard('https://www.example.com/search?test=*')).toBe(false);
    expect(hasPathWildcard('https://www.example.com/page#*')).toBe(false);
  });
});

describe('initialCaptureAddress', () => {
  const capture = (capturedFromUrl: string) => ({ capturedFromUrl }) as HeatmapCapture;

  it('starts from the page captured last, else the page path on the suggested origin', () => {
    expect(
      initialCaptureAddress('/profile/*/posts', origin, [
        capture('https://staging.example.net/profile/b/posts'),
        capture('https://www.example.com/profile/a/posts'),
      ]),
    ).toBe('https://staging.example.net/profile/b/posts');
    expect(initialCaptureAddress('/profile/*/posts', origin, [])).toBe('https://www.example.com/profile/*/posts');
    expect(initialCaptureAddress('/profile/*/posts', undefined, [])).toBeNull();
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
  it('opens every device in a window of its width', () => {
    expect(captureWindowFeatures('desktop')).toBe('popup,width=1440,height=900');
    expect(captureWindowFeatures('tablet')).toBe('popup,width=768,height=1024');
    expect(captureWindowFeatures('mobile')).toBe('popup,width=390,height=844');
  });
});
