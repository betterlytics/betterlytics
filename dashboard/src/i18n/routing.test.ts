import { describe, expect, it } from 'vitest';
import { isSignedInPath, isUnlocalizedPath } from './routing';

describe('isUnlocalizedPath', () => {
  it('matches the app, its API and admin, with or without a query or hash', () => {
    for (const href of [
      '/dashboards',
      '/dashboard/abc',
      '/dashboards?x=1',
      '/dashboards#top',
      '/api/auth/session',
      '/billing',
      '/admin/users',
    ]) {
      expect(isUnlocalizedPath(href)).toBe(true);
    }
  });

  it('leaves the localized site alone, including look-alike prefixes', () => {
    for (const href of [
      '/',
      '/signin',
      '/da/dashboards',
      '/dashboardsx',
      '/apis',
      '/signin?callbackUrl=/dashboards',
    ]) {
      expect(isUnlocalizedPath(href)).toBe(false);
    }
  });
});

describe('isSignedInPath', () => {
  it('matches the signed-in app and admin', () => {
    for (const pathname of ['/dashboard', '/dashboard/abc/pages', '/dashboards', '/billing', '/admin/users']) {
      expect(isSignedInPath(pathname)).toBe(true);
    }
  });

  it('leaves the API, the localized site and look-alike prefixes alone', () => {
    for (const pathname of ['/api/auth/session', '/', '/signin', '/da/dashboard', '/dashboardsx', '/billings']) {
      expect(isSignedInPath(pathname)).toBe(false);
    }
  });
});
