import { z } from 'zod';

export const STATUS_PAGE_LIMITS = {
  NAME_MAX: 60,
  SLUG_MIN: 3,
  SLUG_MAX: 63,
  PUBLIC_NAME_MAX: 40,
  MONITORS_MAX: 20,
  UPTIME_WINDOW_DAYS: 90,
  INCIDENT_TITLE_MAX: 100,
  INCIDENT_BODY_MAX: 2000,
  INCIDENTS_MAX: 50,
  SUGGESTIONS_MAX: 20,
  // Logos are resized client-side to a small raster before upload; the cap is a server-side backstop.
  LOGO_MAX_BYTES: 64 * 1024,
} as const;

/** Raster formats only — the client canvas-resize produces these, and excluding SVG avoids its sanitization burden. */
export const STATUS_PAGE_LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const STATUS_PAGE_DEFAULT_ACCENT_COLOR = '#4845d8';

export const STATUS_PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slugs that must never become a public status page URL
 */
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

export const StatusPageMonitorSelectionSchema = z.object({
  monitorCheckId: z.string().min(1),
  publicName: z.string().trim().min(1).max(STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX),
});
export type StatusPageMonitorSelection = z.infer<typeof StatusPageMonitorSelectionSchema>;

export const StatusPageCreateSchema = z.object({
  name: z.string().trim().min(1).max(STATUS_PAGE_LIMITS.NAME_MAX),
  slug: StatusPageSlugSchema,
  theme: StatusPageThemeSchema.default('system'),
  accentColor: StatusPageAccentColorSchema.default(STATUS_PAGE_DEFAULT_ACCENT_COLOR),
  logoUrl: z.string().nullable().optional(),
  showPastIncidents: z.boolean().default(true),
  monitors: z
    .array(StatusPageMonitorSelectionSchema)
    .min(1, 'Select at least one monitor')
    .max(STATUS_PAGE_LIMITS.MONITORS_MAX),
});
export type StatusPageCreate = z.infer<typeof StatusPageCreateSchema>;

export const StatusPageUpdateSchema = StatusPageCreateSchema.partial().extend({
  id: z.string().min(1),
  isPublished: z.boolean().optional(),
});
export type StatusPageUpdate = z.infer<typeof StatusPageUpdateSchema>;

export const StatusPageSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublished: z.boolean(),
  theme: StatusPageThemeSchema,
  accentColor: z.string(),
  logoUrl: z.string().nullable(),
  showPastIncidents: z.boolean(),
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

export type StatusPagePreviewPayload = {
  data: PublicStatusPageData;
  monitorCheckIds: string[];
  incidentMonitorIndexes: number[];
};

export const PublicOverallStatusSchema = z.enum(['operational', 'degraded', 'outage', 'unknown']);
export type PublicOverallStatus = z.infer<typeof PublicOverallStatusSchema>;

export const PublicMonitorStatusSchema = z.enum(['operational', 'degraded', 'down', 'unknown']);
export type PublicMonitorStatus = z.infer<typeof PublicMonitorStatusSchema>;

export const PublicIncidentCauseSchema = z.enum([
  'serverError',
  'clientError',
  'timeout',
  'ssl',
  'network',
  'disruption',
]);
export type PublicIncidentCause = z.infer<typeof PublicIncidentCauseSchema>;

export const PublicDailyUptimeBucketSchema = z.object({
  /** ISO date (yyyy-mm-dd), UTC bucketed */
  date: z.string(),
  /** 0..1, null = no data for that day (e.g. before the monitor existed) */
  upRatio: z.number().min(0).max(1).nullable(),
});
export type PublicDailyUptimeBucket = z.infer<typeof PublicDailyUptimeBucketSchema>;

export const PublicStatusPageMonitorSchema = z.object({
  /** Opaque, positional — never an internal MonitorCheck id */
  key: z.string(),
  publicName: z.string(),
  status: PublicMonitorStatusSchema,
  /** Percent 0..100, null when the monitor has no data yet */
  uptime: z.number().nullable(),
  days: z.array(PublicDailyUptimeBucketSchema),
});
export type PublicStatusPageMonitor = z.infer<typeof PublicStatusPageMonitorSchema>;

/** Default public label for a monitor: its name, or the URL hostname when unnamed. */
export function defaultPublicMonitorName(monitor: { name?: string | null; url: string }): string {
  return (monitor.name ?? new URL(monitor.url).hostname).slice(0, STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX);
}

/**
 * Admin-facing label for a monitor in the dashboard's own lists (selection / reorder rows): its
 * name, or the raw URL when unnamed so owners can tell rows apart.
 */
export function monitorRowLabel(monitor: { name?: string | null; url: string }): string {
  return monitor.name ?? monitor.url;
}

export const StatusPageIncidentImpactSchema = z.enum(['degraded', 'outage']);
export type StatusPageIncidentImpact = z.infer<typeof StatusPageIncidentImpactSchema>;

export const StatusPageIncidentStatusSchema = z.enum(['investigating', 'identified', 'monitoring', 'resolved']);
export type StatusPageIncidentStatusValue = z.infer<typeof StatusPageIncidentStatusSchema>;

export const PublicStatusPageIncidentSchema = z.object({
  title: z.string(),
  body: z.string(),
  impact: StatusPageIncidentImpactSchema,
  status: StatusPageIncidentStatusSchema,
  /** Affected monitor's public name, or null for a page-wide incident. */
  monitorPublicName: z.string().nullable(),
  startedAt: z.string(),
  resolvedAt: z.string().nullable(),
});
export type PublicStatusPageIncident = z.infer<typeof PublicStatusPageIncidentSchema>;

export const PublicStatusPageDataSchema = z.object({
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  accentColor: z.string(),
  theme: StatusPageThemeSchema,
  overallStatus: PublicOverallStatusSchema,
  lastUpdatedAt: z.string(),
  /** Percent 0..100 (mean of per-monitor uptime), null when no monitor has data */
  overallUptime: z.number().nullable(),
  monitors: z.array(PublicStatusPageMonitorSchema),
  /** null = past-incidents section disabled by the owner; [] = enabled but empty */
  incidents: z.array(PublicStatusPageIncidentSchema).nullable(),
});
export type PublicStatusPageData = z.infer<typeof PublicStatusPageDataSchema>;

export const StatusPageIncidentSchema = z.object({
  id: z.string(),
  statusPageId: z.string(),
  title: z.string(),
  body: z.string(),
  impact: StatusPageIncidentImpactSchema,
  status: StatusPageIncidentStatusSchema,
  startedAt: z.date(),
  resolvedAt: z.date().nullable(),
  isPublished: z.boolean(),
  monitorCheckId: z.string().nullable(),
  detectedIncidentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StatusPageIncident = z.infer<typeof StatusPageIncidentSchema>;

export type IncidentWithSlug = { incident: StatusPageIncident; slug: string };

const incidentTitle = z.string().trim().min(1).max(STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX);
const incidentBody = z.string().trim().min(1).max(STATUS_PAGE_LIMITS.INCIDENT_BODY_MAX);

export const StatusPageIncidentCreateSchema = z
  .object({
    statusPageId: z.string().min(1),
    title: incidentTitle,
    body: incidentBody,
    impact: StatusPageIncidentImpactSchema.default('outage'),
    status: StatusPageIncidentStatusSchema.default('investigating'),
    startedAt: z.coerce.date(),
    resolvedAt: z.coerce.date().nullable().default(null),
    monitorCheckId: z.string().min(1).nullable().default(null),
    detectedIncidentId: z.string().min(1).nullable().default(null),
    isPublished: z.boolean().default(false),
  })
  .refine((data) => data.resolvedAt == null || data.resolvedAt >= data.startedAt, {
    message: 'resolvedAt must be at or after startedAt',
    path: ['resolvedAt'],
  });

export type StatusPageIncidentCreate = z.infer<typeof StatusPageIncidentCreateSchema>;

export const StatusPageIncidentUpdateSchema = z.object({
  id: z.string().min(1),
  statusPageId: z.string().min(1),
  title: incidentTitle.optional(),
  body: incidentBody.optional(),
  impact: StatusPageIncidentImpactSchema.optional(),
  status: StatusPageIncidentStatusSchema.optional(),
  startedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
  monitorCheckId: z.string().min(1).nullable().optional(),
  isPublished: z.boolean().optional(),
});
export type StatusPageIncidentUpdate = z.infer<typeof StatusPageIncidentUpdateSchema>;

export type DetectedOutageSuggestion = {
  /** ClickHouse incident id (analytics.monitor_incidents.incident_id). */
  detectedIncidentId: string;
  monitorCheckId: string;
  monitorPublicName: string;
  startedAt: string;
  resolvedAt: string | null;
  ongoing: boolean;
  reasonCode: string;
  suggestedImpact: StatusPageIncidentImpact;
};
