import { describe, expect, it } from 'vitest';
import { normalizeDomainInput, normalizeUrl } from './domainValidation';

describe('normalizeUrl', () => {
  it('keeps a non-default port so different ports do not collide', () => {
    expect(normalizeUrl('http://a.lan:3000/')).toBe('http://a.lan:3000/');
    expect(normalizeUrl('http://a.lan:3000/')).not.toBe(normalizeUrl('http://a.lan:9090/'));
  });

  it.each([
    ['http://a.lan:80/', 'http://a.lan/'],
    ['https://a.lan:443/health', 'https://a.lan/health'],
    ['HTTP://A.LAN:3000/x/', 'http://a.lan:3000/x'],
  ])('%s normalizes like %s', (a, b) => {
    expect(normalizeUrl(a)).toBe(normalizeUrl(b));
  });
});

describe('normalizeDomainInput', () => {
  it.each([
    ['example.com', 'example.com', 'bare domain is untouched'],
    ['  example.com  ', 'example.com', 'surrounding whitespace'],
    ['https://example.com', 'example.com', 'protocol'],
    ['HTTPS://WWW.Example.COM', 'example.com', 'uppercase protocol, www and host'],
    ['www.example.com', 'example.com', 'www prefix'],
    ['example.com/', 'example.com', 'trailing slash'],
    ['https://example.com/', 'example.com', 'protocol and trailing slash'],
    ['https://example.com/some/page?utm=1#top', 'example.com', 'full url with path, query and fragment'],
    ['example.com?ref=x', 'example.com', 'query without path'],
    ['example.com:3000', 'example.com', 'port'],
    ['example.com.', 'example.com', 'trailing dot'],
    ['https://blog.example.co.uk/posts', 'blog.example.co.uk', 'subdomain is kept'],
  ])('%s → %s (%s)', (input, expected) => {
    expect(normalizeDomainInput(input)).toBe(expected);
  });
});
