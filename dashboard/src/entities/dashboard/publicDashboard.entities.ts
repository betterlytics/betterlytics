import { z } from 'zod';
import { isReservedPublicSlug } from '@/entities/system/publicSlug.entities';

// Keys match the sidebar item keys in BASidebar.tsx
export const PUBLIC_DASHBOARD_PAGES = [
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
] as const;

export const PublicDashboardPageSchema = z.enum(PUBLIC_DASHBOARD_PAGES);
export type PublicDashboardPage = z.infer<typeof PublicDashboardPageSchema>;

export const DEFAULT_PUBLIC_DASHBOARD_PAGES: PublicDashboardPage[] = ['overview'];

export const PublicDashboardPagesSchema = z
  .array(PublicDashboardPageSchema)
  .min(1, 'At least one page must stay enabled')
  .transform((pages) => PUBLIC_DASHBOARD_PAGES.filter((page) => pages.includes(page)));

export const PUBLIC_DASHBOARD_SLUG_FALLBACK = 'my-dashboard';

// Stricter than status pages: any `demo` prefix is blocked, since the demo dashboard also lives under /share/
export function isReservedPublicDashboardSlug(slug: string): boolean {
  return isReservedPublicSlug(slug) || slug.startsWith('demo');
}

export const PublicDashboardSettingsSchema = z.object({
  isPublic: z.boolean(),
  slug: z.string().nullable(),
  enabledPages: z.array(PublicDashboardPageSchema),
});
export type PublicDashboardSettings = z.infer<typeof PublicDashboardSettingsSchema>;

export type PublicDashboardSettingsUpdate = Partial<PublicDashboardSettings>;

export type PublicDashboardSlugRejection = 'invalid' | 'reserved' | 'taken';

export type PublicDashboardSlugCheck =
  { available: true; slug: string } | { available: false; reason: PublicDashboardSlugRejection };
