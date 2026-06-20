import { z } from 'zod';
import { StatusPageThemeSchema } from './statusPage.entities';
import { StatusPageIncidentImpactSchema, StatusPageIncidentStatusSchema } from './statusPageIncident.entities';

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
  faviconUrl: z.string().nullable().default(null),
  homepageUrl: z.string().nullable().default(null),
  noindex: z.boolean().default(false),
  accentColor: z.string(),
  theme: StatusPageThemeSchema,
  overallStatus: PublicOverallStatusSchema,
  lastUpdatedAt: z.string(),
  /** Percent 0..100 (mean of per-monitor uptime), null when no monitor has data */
  overallUptime: z.number().nullable(),
  /** When true the "Powered by Betterlytics" footer is hidden */
  hideBranding: z.boolean().default(false),
  monitors: z.array(PublicStatusPageMonitorSchema),
  /** null = past-incidents section disabled by the owner; [] = enabled but empty */
  incidents: z.array(PublicStatusPageIncidentSchema).nullable(),
});
export type PublicStatusPageData = z.infer<typeof PublicStatusPageDataSchema>;

export type StatusPagePreviewPayload = {
  data: PublicStatusPageData;
  monitorCheckIds: string[];
  incidentMonitorIndexes: number[];
};
