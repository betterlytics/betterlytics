import { describe, it, expect } from 'vitest';
import { getSigninPath, SIGNIN_RETURN_TO_HEADER, withSigninReturnTo } from '@/lib/auth/signin-redirect';

function request(method: string, headers: Record<string, string>, pathname: string, search = '') {
  return { method, headers: new Headers(headers), nextUrl: { pathname, search } };
}

const DOCUMENT = { 'sec-fetch-dest': 'document' };

describe('withSigninReturnTo', () => {
  it('records path and query of a document load', () => {
    const headers = withSigninReturnTo(request('GET', DOCUMENT, '/dashboard/abc/pages', '?filters=x&range=7d'));
    expect(headers.get(SIGNIN_RETURN_TO_HEADER)).toBe('/dashboard/abc/pages?filters=x&range=7d');
  });

  it('keeps the other request headers', () => {
    const headers = withSigninReturnTo(request('GET', { ...DOCUMENT, cookie: 'a=1' }, '/billing'));
    expect(headers.get('cookie')).toBe('a=1');
  });

  it.each([
    ['server action', request('POST', { ...DOCUMENT, 'next-action': 'abc' }, '/dashboard/abc/funnels')],
    ['client navigation or prefetch', request('GET', { 'sec-fetch-dest': 'empty' }, '/dashboard/abc/pages')],
    ['request without Sec-Fetch-Dest', request('GET', {}, '/dashboard/abc/pages')],
  ])('records nothing for a %s', (_label, req) => {
    expect(withSigninReturnTo(req).has(SIGNIN_RETURN_TO_HEADER)).toBe(false);
  });

  it('replaces a client-supplied value', () => {
    const spoofed = { [SIGNIN_RETURN_TO_HEADER]: '/admin' };
    expect(
      withSigninReturnTo(request('GET', { ...DOCUMENT, ...spoofed }, '/billing')).get(SIGNIN_RETURN_TO_HEADER),
    ).toBe('/billing');
    expect(withSigninReturnTo(request('POST', spoofed, '/billing')).has(SIGNIN_RETURN_TO_HEADER)).toBe(false);
  });
});

describe('getSigninPath', () => {
  it('encodes the whole destination once as callbackUrl', () => {
    const headers = new Headers({ [SIGNIN_RETURN_TO_HEADER]: '/dashboard/abc/pages?filters=x&range=7d' });
    expect(getSigninPath(headers)).toBe(
      '/signin?callbackUrl=%2Fdashboard%2Fabc%2Fpages%3Ffilters%3Dx%26range%3D7d',
    );
  });

  it('round-trips through the query string', () => {
    const destination = '/dashboard/abc/pages?filters=a%2Cb&range=7d';
    const url = new URL(
      getSigninPath(new Headers({ [SIGNIN_RETURN_TO_HEADER]: destination })),
      'http://x.invalid',
    );
    expect(url.searchParams.get('callbackUrl')).toBe(destination);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['external', 'https://evil.example/x'],
    ['protocol-relative', '//evil.example'],
    ['dot segment', '/.//evil.example'],
  ])('falls back to plain /signin when the destination is %s', (_label, value) => {
    const headers = new Headers(value === undefined ? {} : { [SIGNIN_RETURN_TO_HEADER]: value });
    expect(getSigninPath(headers)).toBe('/signin');
  });
});
