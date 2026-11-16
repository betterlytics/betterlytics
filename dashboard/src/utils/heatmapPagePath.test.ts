import { describe, it, expect } from 'vitest';
import { matchesPagePath, pathnameOf } from '@/utils/heatmapPagePath';

describe('matchesPagePath', () => {
  it('matches literally without wildcards', () => {
    expect(matchesPagePath('/pricing', '/pricing')).toBe(true);
    expect(matchesPagePath('/pricing', '/pricing/')).toBe(false);
    expect(matchesPagePath('/pricing', '/about')).toBe(false);
    expect(matchesPagePath('/', '/')).toBe(true);
  });

  it('lets a wildcard stand for one or more characters', () => {
    expect(matchesPagePath('/profile/*/posts', '/profile/betterlytics/posts')).toBe(true);
    expect(matchesPagePath('/profile/*/posts', '/profile/a/b/posts')).toBe(true);
    expect(matchesPagePath('/profile/*/posts', '/profile//posts')).toBe(false);
    expect(matchesPagePath('/profile/*/posts', '/profile/betterlytics')).toBe(false);
    expect(matchesPagePath('/profile/*/posts', '/settings')).toBe(false);
    expect(matchesPagePath('/docs/*', '/docs/guide/install')).toBe(true);
    expect(matchesPagePath('/docs/*', '/docs/')).toBe(false);
    expect(matchesPagePath('/*/a/*/b', '/x/a/y/b')).toBe(true);
    expect(matchesPagePath('/*/a/*/b', '/x/a/b')).toBe(false);
  });
});

describe('pathnameOf', () => {
  it('drops the query string and encodes like the tracker', () => {
    expect(pathnameOf('/profile/betterlytics/posts?tab=new')).toBe('/profile/betterlytics/posts');
    expect(pathnameOf('/profil/søren')).toBe('/profil/s%C3%B8ren');
  });
});
