import { describe, it, expect } from 'vitest';
import {
  isReservedPublicDashboardSlug,
  PUBLIC_DASHBOARD_PAGES,
  PublicDashboardPagesSchema,
} from '@/entities/dashboard/publicDashboard.entities';
import { PublicSlugFormatSchema, PublicSlugSchema, slugifyDomain } from '@/entities/system/publicSlug.entities';

describe('public dashboard slug rules', () => {
  it.each(['abc', 'betterlytics-io', 'a1-b2-c3', 'x'.repeat(63), 'my-dashboard-2'])('accepts %s', (slug) => {
    expect(PublicSlugFormatSchema.safeParse(slug).success).toBe(true);
    expect(isReservedPublicDashboardSlug(slug)).toBe(false);
  });

  it('normalizes case and surrounding whitespace', () => {
    expect(PublicSlugFormatSchema.parse('  My-Site ')).toBe('my-site');
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'x'.repeat(64)],
    ['double hyphen', 'my--site'],
    ['leading hyphen', '-site'],
    ['trailing hyphen', 'site-'],
    ['underscore', 'my_site'],
    ['dot', 'my.site'],
    ['non-ascii', 'café'],
    ['empty', ''],
  ])('rejects %s', (_label, slug) => {
    expect(PublicSlugFormatSchema.safeParse(slug).success).toBe(false);
  });

  it.each(['admin', 'api', 'share', 'status', 'dashboard', 'demo', 'demo-site', 'demosite', 'democracy'])(
    'rejects reserved %s',
    (slug) => {
      expect(isReservedPublicDashboardSlug(slug)).toBe(true);
    },
  );
});

describe('PublicSlugSchema (status pages)', () => {
  it('keeps the existing status page rules', () => {
    expect(PublicSlugSchema.safeParse('demo-site').success).toBe(false);
    expect(PublicSlugSchema.safeParse('share').success).toBe(false);
    expect(PublicSlugSchema.safeParse('demosite').success).toBe(true);
  });
});

describe('slugifyDomain', () => {
  it.each([
    ['betterlytics.io', 'betterlytics-io'],
    ['Sub.Example.co.uk', 'sub-example-co-uk'],
    ['my--site.com', 'my-site-com'],
    ['.weird..domain.', 'weird-domain'],
  ])('%s becomes %s', (domain, slug) => {
    expect(slugifyDomain(domain)).toBe(slug);
  });

  it('trims to the max length without a trailing hyphen', () => {
    const slug = slugifyDomain(`${'a'.repeat(62)}.io`);
    expect(slug).toBe('a'.repeat(62));
  });
});

describe('PublicDashboardPagesSchema', () => {
  it('lists every shareable page', () => {
    expect(PUBLIC_DASHBOARD_PAGES).toEqual([
      'overview',
      'pages',
      'referrers',
      'outboundLinks',
      'geography',
      'devices',
      'campaigns',
      'userJourney',
      'funnels',
      'events',
      'sessionReplay',
      'webVitals',
      'errors',
    ]);
  });

  it('allows Overview to be off when another page is on', () => {
    expect(PublicDashboardPagesSchema.parse(['campaigns'])).toEqual(['campaigns']);
  });

  it('dedupes and orders pages', () => {
    expect(PublicDashboardPagesSchema.parse(['errors', 'overview', 'errors'])).toEqual(['overview', 'errors']);
  });

  it('refuses an empty list', () => {
    expect(PublicDashboardPagesSchema.safeParse([]).success).toBe(false);
  });

  it.each(['settings', 'monitoring', 'statusPages', 'Overview'])('refuses unknown page %s', (page) => {
    expect(PublicDashboardPagesSchema.safeParse(['overview', page]).success).toBe(false);
  });
});
