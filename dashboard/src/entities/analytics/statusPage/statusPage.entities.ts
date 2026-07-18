import { z } from 'zod';

export const STATUS_PAGE_LIMITS = {
  NAME_MAX: 60,
  SLUG_MIN: 3,
  SLUG_MAX: 63,
  PUBLIC_NAME_MAX: 40,
  MONITORS_MAX: 20,
  UPTIME_WINDOW_DAYS: 90,
  INCIDENT_TITLE_MAX: 100,
  INCIDENT_DESCRIPTION_MAX: 2000,
  INCIDENT_UPDATE_MESSAGE_MAX: 2000,
  INCIDENT_UPDATES_MAX: 100,
  INCIDENTS_MAX: 50,
  SUGGESTIONS_MAX: 20,
  // Recovered outages stop being suggested this long after resolving (covers overnight + weekends).
  SUGGESTIONS_RESOLVED_MAX_AGE_DAYS: 3,
  // Detected outages whose start times fall within this window are treated as one incident (shared
  // root cause across monitors) and folded into a single multi-monitor suggestion.
  SUGGESTIONS_CORRELATION_WINDOW_MINUTES: 10,
  // Images are resized client-side to a small raster before upload; the cap is a server-side backstop.
  // Sized so a 512px WebP of a worst-case (gradient/photo-heavy) logo still fits.
  IMAGE_MAX_BYTES: 128 * 1024,
  // Server-side backstop on decoded dimensions (intrinsic px). Guards against decompression bombs from a
  // client that bypasses the canvas resize.
  IMAGE_MAX_DIMENSION: 1024,
} as const;

/** Accepted raster formats (both kinds). SVG is additionally accepted for the logo, via its own sanitizing path. */
export const STATUS_PAGE_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const STATUS_PAGE_IMAGE_KINDS = ['logo', 'favicon'] as const;
export const StatusPageImageKindSchema = z.enum(STATUS_PAGE_IMAGE_KINDS);
export type StatusPageImageKind = z.infer<typeof StatusPageImageKindSchema>;

export const STATUS_PAGE_IMAGE_ACCEPT: Record<StatusPageImageKind, string> = {
  logo: 'image/png,image/jpeg,image/webp,image/svg+xml,.svg',
  favicon: 'image/png,image/jpeg,image/webp',
};

/** raw bytes = set/replace, null = remove, omitted = leave unchanged. */
export type StatusPageImagesInput = {
  logo?: Uint8Array | null;
  favicon?: Uint8Array | null;
};

export const STATUS_PAGE_IMAGE_CONFIG: Record<StatusPageImageKind, { maxDimension: number; square: boolean }> = {
  logo: { maxDimension: 512, square: false },
  favicon: { maxDimension: 64, square: true },
};

export const STATUS_PAGE_DEFAULT_ACCENT_COLOR = '#304870';

export const STATUS_PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_STATUS_PAGE_SLUGS = new Set([
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

export const RESERVED_STATUS_PAGE_SLUG_PREFIX = /^demo(-|$)/;

export const StatusPageThemeSchema = z.enum(['light', 'dark', 'system']);
export type StatusPageTheme = z.infer<typeof StatusPageThemeSchema>;

export const StatusPageSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(STATUS_PAGE_LIMITS.SLUG_MIN)
  .max(STATUS_PAGE_LIMITS.SLUG_MAX)
  .regex(STATUS_PAGE_SLUG_REGEX, 'Only lowercase letters, digits and single hyphens')
  .refine(
    (slug) => !RESERVED_STATUS_PAGE_SLUGS.has(slug) && !RESERVED_STATUS_PAGE_SLUG_PREFIX.test(slug),
    'This slug is reserved',
  );

export const StatusPageAccentColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color');

export const StatusPageVisibilitySchema = z.enum(['public', 'unlisted']);
export type StatusPageVisibility = z.infer<typeof StatusPageVisibilitySchema>;

export const StatusPageHomepageUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'Enter an http(s) URL');

const CUSTOM_DOMAIN_REGEX = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export const RESERVED_STATUS_PAGE_DOMAIN_LABELS = new Set(['betterlytics']);

function isReservedStatusPageDomain(domain: string): boolean {
  return domain.split('.').some((label) => RESERVED_STATUS_PAGE_DOMAIN_LABELS.has(label));
}

/**
 * A CNAME can't live on the zone apex, so the custom domain must be a subdomain. Without a public
 * suffix list we approximate "has a subdomain" as "at least three labels" (sub.domain.tld) — this
 * rejects a bare apex like example.com while accepting status.example.com.
 */
function isStatusPageSubdomain(domain: string): boolean {
  return domain.split('.').length >= 3;
}

export const StatusPageCustomDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(CUSTOM_DOMAIN_REGEX, 'Enter a valid domain, e.g. status.example.com')
  .refine(isStatusPageSubdomain, 'Use a subdomain like status.example.com, not the root domain')
  .refine((domain) => !isReservedStatusPageDomain(domain), 'This domain is reserved');

export const StatusPageMonitorSelectionSchema = z.object({
  monitorCheckId: z.string().min(1),
  publicName: z.string().trim().min(1).max(STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX),
});
export type StatusPageMonitorSelection = z.infer<typeof StatusPageMonitorSelectionSchema>;

export const StatusPageCreateSchema = z.object({
  name: z.string().trim().min(1).max(STATUS_PAGE_LIMITS.NAME_MAX),
  slug: StatusPageSlugSchema,
  // Publish-at-create rides the single insert, so create+publish can never half-fail.
  isPublished: z.boolean().default(false),
  theme: StatusPageThemeSchema.default('system'),
  accentColor: StatusPageAccentColorSchema.default(STATUS_PAGE_DEFAULT_ACCENT_COLOR),
  showPastIncidents: z.boolean().default(true),
  hideBranding: z.boolean().default(false),
  visibility: StatusPageVisibilitySchema.default('public'),
  homepageUrl: StatusPageHomepageUrlSchema.nullable().optional(),
  customDomain: StatusPageCustomDomainSchema.nullable().optional(),
  monitors: z
    .array(StatusPageMonitorSelectionSchema)
    .min(1, 'Select at least one monitor')
    .max(STATUS_PAGE_LIMITS.MONITORS_MAX),
});
export type StatusPageCreate = z.infer<typeof StatusPageCreateSchema>;

export const StatusPageUpdateSchema = StatusPageCreateSchema.omit({ isPublished: true })
  .partial()
  .extend({
    id: z.string().min(1),
  });
export type StatusPageUpdate = z.infer<typeof StatusPageUpdateSchema>;

export const StatusPageSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublished: z.boolean(),
  visibility: StatusPageVisibilitySchema,
  homepageUrl: z.string().nullable(),
  customDomain: z.string().nullable(),
  theme: StatusPageThemeSchema,
  accentColor: z.string(),
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  showPastIncidents: z.boolean(),
  hideBranding: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StatusPage = z.infer<typeof StatusPageSchema>;

export const StatusPageMonitorRowSchema = z.object({
  id: z.string(),
  statusPageId: z.string(),
  monitorCheckId: z.string(),
  publicName: z.string(),
  position: z.number().int(),
});
export type StatusPageMonitorRow = z.infer<typeof StatusPageMonitorRowSchema>;

export type StatusPageWithMonitors = StatusPage & { monitors: StatusPageMonitorRow[] };

export type StatusPageListMonitor = { monitorCheckId: string; publicName: string };

export type StatusPageListItem = StatusPage & {
  monitorCount: number;
  monitors: StatusPageListMonitor[];
  activeIncidentCount: number;
};

export type PublishedStatusPage = {
  page: StatusPage;
  siteId: string;
  monitors: Array<{
    monitorCheckId: string;
    publicName: string;
    position: number;
    isEnabled: boolean;
    monitorCreatedAt: Date;
  }>;
};
