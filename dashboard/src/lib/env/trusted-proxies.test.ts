import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { getIp } from 'better-auth/api';
import { parseEnv } from '@/lib/env/parse-env';
import { zTrustedProxies } from '@/lib/env/trusted-proxies';

const schema = z.object({ AUTH_TRUSTED_PROXIES: zTrustedProxies });
const parse = (raw?: string) => parseEnv('test', schema, { AUTH_TRUSTED_PROXIES: raw }).AUTH_TRUSTED_PROXIES;

const resolve = (forwardedFor: string, raw?: string) =>
  getIp(new Headers({ 'x-forwarded-for': forwardedFor }), {
    advanced: { ipAddress: { trustedProxies: parse(raw) } },
  });

describe('AUTH_TRUSTED_PROXIES parsing', () => {
  it('is empty when unset or blank', () => {
    expect(parse()).toEqual([]);
    expect(parse('')).toEqual([]);
    expect(parse('  ')).toEqual([]);
  });

  it.each([
    ['172.18.0.1,10.0.0.0/24', ['172.18.0.1', '10.0.0.0/24']],
    ['172.18.0.1 10.0.0.0/24', ['172.18.0.1', '10.0.0.0/24']],
    [' 172.18.0.1 ,\n10.0.0.0/24, ', ['172.18.0.1', '10.0.0.0/24']],
    ['fd00::1 2001:db8::/32', ['fd00::1', '2001:db8::/32']],
  ])('splits %j on commas and whitespace', (raw, expected) => {
    expect(parse(raw)).toEqual(expected);
  });

  it.each([
    'private_ranges',
    'nope',
    '10.0.0.0/33',
    '1.2.3.4:80',
    'fe80::1%eth0',
    '::ffff:172.18.0.1/24',
    '0:0:0:0:0:ffff:ac12:1/128',
  ])('refuses %s', (entry) => {
    expect(() => parse(entry)).toThrow(`AUTH_TRUSTED_PROXIES: invalid entries: ${entry}.`);
  });

  it('names every bad entry even next to a valid one', () => {
    expect(() => parse('172.18.0.1 nope 10.0.0.0/33')).toThrow(
      'AUTH_TRUSTED_PROXIES: invalid entries: nope, 10.0.0.0/33. Each entry must be an IP address or CIDR range',
    );
  });
});

describe('client IP resolution (better-auth)', () => {
  const HOP = '172.18.0.1';
  // better-auth substitutes localhost for "no trustworthy IP" outside production
  const UNRESOLVED = '127.0.0.1';

  it.each([
    ['172.18.0.1', '172.18.0.1'],
    ['10.0.0.0/24', '10.0.0.5'],
    ['::ffff:172.18.0.1', '172.18.0.1'],
    ['fd00::1', 'fd00::1'],
    ['FD00::/64', 'fd00::5'],
    ['2001:db8::/32', '2001:db8::1'],
  ])('honors the accepted entry %s', (entry, hop) => {
    expect(resolve(`203.0.113.7, ${hop}`, entry)).toBe('203.0.113.7');
  });

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
});
