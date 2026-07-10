import { z } from 'zod';
import { StatusPageThemeSchema } from './statusPage.entities';
import { StatusPageIncidentImpactSchema, StatusPageIncidentStatusSchema } from './statusPageIncident.entities';

export const PublicOverallStatusSchema = z.enum([
  'operational',
  'degraded',
  'partial_outage',
  'outage',
  'unknown',
]);
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
  /** null = no data for that day (e.g. before the monitor existed) */
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

// A single public timeline update. Only the visitor-safe fields are exposed — never the author.
export const PublicStatusPageIncidentUpdateSchema = z.object({
  status: StatusPageIncidentStatusSchema,
  message: z.string(),
  createdAt: z.string(),
});
export type PublicStatusPageIncidentUpdate = z.infer<typeof PublicStatusPageIncidentUpdateSchema>;

export const PublicStatusPageIncidentSchema = z.object({
  title: z.string(),
  body: z.string(),
  impact: StatusPageIncidentImpactSchema,
  status: StatusPageIncidentStatusSchema,
  /** Affected monitors' public names; empty for a page-wide incident. */
  monitorPublicNames: z.array(z.string()).default([]),
  startedAt: z.string(),
  resolvedAt: z.string().nullable(),
  /** Change timeline, newest first. */
  updates: z.array(PublicStatusPageIncidentUpdateSchema).default([]),
});
export type PublicStatusPageIncident = z.infer<typeof PublicStatusPageIncidentSchema>;

export const PublicStatusPageDataSchema = z.object({
  name: z.string(),
  slug: z.string(),
  customDomain: z.string().nullable().default(null),
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable().default(null),
  homepageUrl: z.string().nullable().default(null),
  noindex: z.boolean().default(false),
  accentColor: z.string(),
  theme: StatusPageThemeSchema,
  overallStatus: PublicOverallStatusSchema,
  lastUpdatedAt: z.string(),
  overallUptime: z.number().nullable(),
  hideBranding: z.boolean().default(false),
  showPastIncidents: z.boolean().default(true),
  monitors: z.array(PublicStatusPageMonitorSchema),
  incidents: z.array(PublicStatusPageIncidentSchema).nullable(),
});
export type PublicStatusPageData = z.infer<typeof PublicStatusPageDataSchema>;

export type StatusPagePreviewPayload = {
  data: PublicStatusPageData;
  monitorCheckIds: string[];
  detectedStatuses: PublicMonitorStatus[];
  /** Affected monitor check ids per incident (same order as `data.incidents`); editor-only, for live rename remap. */
  incidentMonitorCheckIds: string[][];
};
