import { describe, it, expect } from 'vitest';
import {
  decideStatusHostRoute,
  hostnameOf,
  isOwnHost,
  normalizeHostname,
  ownHostsFrom,
} from './status-host-routing';
import { statusPageCnameTarget } from '@/entities/analytics/statusPage/statusPage.helpers';

describe('normalizeHostname', () => {
  it('lowercases and strips port then trailing dot', () => {
    expect(normalizeHostname('Status.Acme.com.:443')).toBe('status.acme.com');
    expect(normalizeHostname('status.acme.com.')).toBe('status.acme.com');
    expect(normalizeHostname('  Status.Acme.com:8443 ')).toBe('status.acme.com');
  });
});

describe('hostnameOf', () => {
  it('returns the bare hostname for urls and host:port forms', () => {
    expect(hostnameOf('https://acme.com:8443/')).toBe('acme.com');
    expect(hostnameOf('acme.com:8443/')).toBe('acme.com');
    expect(hostnameOf('localhost:3000')).toBe('localhost');
    expect(hostnameOf('acme.com')).toBe('acme.com');
    expect(hostnameOf('http://localhost:3000')).toBe('localhost');
  });
});

describe('isOwnHost', () => {
  const cloud = ownHostsFrom('https://betterlytics.io', 'status.betterlytics.io', true);
  const cloudOwn = [
    'betterlytics.io',
    'www.betterlytics.io',
    'foo.betterlytics.io',
    'status.betterlytics.io',
    'x.status.betterlytics.io',
    'localhost',
    'app',
    'foo.localhost',
  ];
  const cloudClaimable = ['status.acme.com'];

  const selfhost = ownHostsFrom('https://acme.com', '', false);
  const selfhostOwn = ['acme.com', 'www.acme.com', '192.168.1.10', '[::1]', 'localhost', 'app'];
  const selfhostClaimable = ['status.acme.com', 'foo.acme.com'];

  it('reserves cloud hosts and their subdomains', () => {
    for (const host of cloudOwn) expect(isOwnHost(host, cloud), host).toBe(true);
    for (const host of cloudClaimable) expect(isOwnHost(host, cloud), host).toBe(false);
  });

  it('reserves only the app host, its www and non-domains off cloud', () => {
    for (const host of selfhostOwn) expect(isOwnHost(host, selfhost), host).toBe(true);
    for (const host of selfhostClaimable) expect(isOwnHost(host, selfhost), host).toBe(false);
  });

  it('never marks a host both own and claimable', () => {
    for (const host of cloudOwn) expect(cloudClaimable).not.toContain(host);
    for (const host of selfhostOwn) expect(selfhostClaimable).not.toContain(host);
  });

  it('parses ownHostsFrom inputs leniently', () => {
    expect(ownHostsFrom('https://acme.com', '', false)).toEqual({ appHost: 'acme.com', statusPageDomain: '', wildcard: false });
    expect(ownHostsFrom('localhost:3000', '', false).appHost).toBe('localhost');
    expect(ownHostsFrom('acme.com', '', false).appHost).toBe('acme.com');
  });
});

describe('decideStatusHostRoute', () => {
  const domain = 'status.acme.com';
  const status = (pathname: string) => decideStatusHostRoute('status', domain, pathname, true);
  const paths = ['/', '/dashboard', '/status/domain/status.acme.com', '/_next/image'];

  it('rewrites the root to the domain page', () => {
    expect(status('/')).toEqual({ kind: 'rewrite', pathname: '/status/domain/status.acme.com' });
  });

  it('passes status images and the legacy rewrite path', () => {
    expect(status('/status/x/image/logo')).toEqual({ kind: 'pass' });
    expect(status('/status/domain/status.acme.com')).toEqual({ kind: 'pass' });
    expect(status('/status/domain/Status.Acme.com')).toEqual({ kind: 'pass' });
  });

  it('404s everything else', () => {
    for (const pathname of [
      '/dashboard',
      '/api/trpc/system.publicEnvironmentVariables',
      '/api/trpc/a,b',
      '/status/other',
      '/status/domain/other.com',
      '/favicon.ico',
      '/_next/image',
    ]) {
      expect(status(pathname), pathname).toEqual({ kind: 'notFound' });
    }
  });

  it('reports unavailable regardless of path or deployment', () => {
    for (const pathname of paths) {
      expect(decideStatusHostRoute('unavailable', domain, pathname, true), pathname).toEqual({ kind: 'unavailable' });
      expect(decideStatusHostRoute('unavailable', domain, pathname, false), pathname).toEqual({ kind: 'unavailable' });
    }
  });

  it('404s an unknown host on cloud and passes it through off cloud', () => {
    for (const pathname of paths) {
      expect(decideStatusHostRoute('unknown', domain, pathname, true), pathname).toEqual({ kind: 'notFound' });
      expect(decideStatusHostRoute('unknown', domain, pathname, false), pathname).toEqual({ kind: 'pass' });
    }
  });
});

describe('statusPageCnameTarget', () => {
  it('returns a bare hostname without port or path', () => {
    expect(statusPageCnameTarget('acme', 'acme.com:8443/', false)).toBe('acme.com');
    expect(statusPageCnameTarget('acme', 'acme.com:8443/', true)).toBe('acme.status.acme.com');
  });
});
