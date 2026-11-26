import { z } from 'zod';

// Shared by status pages and public dashboards. Each keeps its own namespace (separate unique indexes).
export const PUBLIC_SLUG_LIMITS = {
  MIN: 3,
  MAX: 63,
} as const;

export const PUBLIC_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_PUBLIC_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'betterlytics',
  'billing',
  'dashboard',
  'dashboards',
  'docs',
  'login',
  'monitoring',
  'pricing',
  'share',
  'signin',
  'signup',
  'status',
  'www',
  'pages',
  'mail',
  'ns1',
  'ns2',
  'dev',
  'staging',
  'domain',
]);

export const RESERVED_PUBLIC_SLUG_PREFIX = /^demo(-|$)/;

export function isReservedPublicSlug(slug: string): boolean {
  return RESERVED_PUBLIC_SLUGS.has(slug) || RESERVED_PUBLIC_SLUG_PREFIX.test(slug);
}

function withSlugFormat(schema: z.ZodString) {
  return schema
    .min(PUBLIC_SLUG_LIMITS.MIN)
    .max(PUBLIC_SLUG_LIMITS.MAX)
    .regex(PUBLIC_SLUG_REGEX, 'Only lowercase letters, digits and single hyphens');
}

/** Strict: uppercase or surrounding whitespace is refused, not normalized. */
export const PublicSlugFormatSchema = withSlugFormat(z.string());

/** Status pages normalize case and whitespace before validating. */
export const PublicSlugSchema = withSlugFormat(z.string().trim().toLowerCase()).refine(
  (slug) => !isReservedPublicSlug(slug),
  'This slug is reserved',
);

/** `betterlytics.io` becomes `betterlytics-io`, trimmed to the max slug length. May be empty or too short. */
export function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, PUBLIC_SLUG_LIMITS.MAX)
    .replace(/-+$/, '');
}
