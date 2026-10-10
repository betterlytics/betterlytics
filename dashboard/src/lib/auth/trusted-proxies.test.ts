import { describe, it, expect } from 'vitest';
import { getIp } from 'better-auth/api';
import { parseTrustedProxies } from '@/lib/auth/trusted-proxies';

describe('parseTrustedProxies', () => {
  it('returns nothing for an empty value', () => {
    expect(parseTrustedProxies('')).toEqual({ valid: [], invalid: [] });
    expect(parseTrustedProxies('  ')).toEqual({ valid: [], invalid: [] });
  });

  it.each([
    ['172.18.0.1,10.0.0.0/24', ['172.18.0.1', '10.0.0.0/24']],
    ['172.18.0.1 10.0.0.0/24', ['172.18.0.1', '10.0.0.0/24']],
    [' 172.18.0.1 ,\n10.0.0.0/24, ', ['172.18.0.1', '10.0.0.0/24']],
    ['fd00::1 2001:db8::/32', ['fd00::1', '2001:db8::/32']],
  ])('splits %j on commas and whitespace', (raw, expected) => {
    expect(parseTrustedProxies(raw)).toEqual({ valid: expected, invalid: [] });
  });

  it('reports entries that are not an IP or CIDR range', () => {
    expect(parseTrustedProxies('172.18.0.1 private_ranges 10.0.0.0/33 1.2.3.4:80 nope')).toEqual({
      valid: ['172.18.0.1'],
      invalid: ['private_ranges', '10.0.0.0/33', '1.2.3.4:80', 'nope'],
    });
  });
});

describe('client IP resolution (better-auth)', () => {
  const HOP = '172.18.0.1';
  // better-auth substitutes localhost for "no trustworthy IP" when NODE_ENV is test
  const UNRESOLVED = '127.0.0.1';

  const resolve = (forwardedFor: string, raw = '') => {
    const trustedProxies = parseTrustedProxies(raw).valid;
    return getIp(
      new Headers({ 'x-forwarded-for': forwardedFor }),
      trustedProxies.length > 0 ? { advanced: { ipAddress: { trustedProxies } } } : {},
    );
  };

  it('tells clients behind a trusted host proxy apart', () => {
    expect(resolve(`203.0.113.7, ${HOP}`, HOP)).toBe('203.0.113.7');
    expect(resolve(`198.51.100.9, ${HOP}`, HOP)).toBe('198.51.100.9');
  });

  it('ignores addresses a client on the LAN puts in front of its own', () => {
    expect(resolve(`6.6.6.6, 192.168.1.50, ${HOP}`, HOP)).toBe('192.168.1.50');
    expect(resolve(`7.7.7.7, 192.168.1.50, ${HOP}`, HOP)).toBe('192.168.1.50');
  });

  it('lets a client pick its own address when a whole private range is trusted', () => {
    expect(resolve(`6.6.6.6, 192.168.1.50, ${HOP}`, '192.168.0.0/16 172.16.0.0/12')).toBe('6.6.6.6');
  });

  it('resolves a single-entry header with nothing configured (Standalone, Cloud)', () => {
    expect(resolve('203.0.113.7')).toBe('203.0.113.7');
  });

  it('resolves nothing for a proxy chain with nothing configured', () => {
    expect(resolve(`203.0.113.7, ${HOP}`)).toBe(UNRESOLVED);
  });

  it('resolves nothing when every hop is trusted', () => {
    expect(resolve(HOP, HOP)).toBe(UNRESOLVED);
  });

  it('matches trusted hops given as IPv4 and IPv6 ranges', () => {
    expect(resolve('203.0.113.7, 10.0.0.5', '10.0.0.0/24')).toBe('203.0.113.7');
    expect(resolve('203.0.113.7, fd00::5', 'fd00::/64')).toBe('203.0.113.7');
  });
});
