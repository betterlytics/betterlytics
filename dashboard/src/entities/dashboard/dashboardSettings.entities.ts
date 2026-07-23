import { z } from 'zod';
import { TIME_RANGE_PRESETS } from '@/utils/timeRanges';
import { MIN_DATA_RETENTION_DAYS } from '@/lib/billing/capabilities';

export const MAX_REPORT_RECIPIENTS = 5;

export const TimeRangeValueSchema = z.enum(
  TIME_RANGE_PRESETS.map((preset) => preset.value) as [string, ...string[]],
);

export const DashboardSettingsSchema = z
  .object({
    id: z.string(),
    dashboardId: z.string(),

    // Display Settings
    showGridLines: z.boolean(),
    defaultDateRange: TimeRangeValueSchema,

    // Data Settings
    dataRetentionDays: z.number().int().min(MIN_DATA_RETENTION_DAYS),
    retentionGraceUntil: z.date().nullable(),
    retentionGraceRestoreDays: z.number().int().positive().nullable(),

    // Report Settings
    weeklyReports: z.boolean(),
    weeklyReportDay: z.number().int().min(1).max(7), // ISO: 1=Monday, 7=Sunday
    weeklyReportRecipients: z.array(z.string().email()),
    monthlyReports: z.boolean(),
    monthlyReportRecipients: z.array(z.string().email()),
    lastWeeklyReportSentAt: z.date().nullable(),
    lastMonthlyReportSentAt: z.date().nullable(),

    // Alert Settings
    alertsEnabled: z.boolean(),
    alertsThreshold: z.number().int().positive(),

    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const DashboardSettingsCreateSchema = z
  .object({
    dashboardId: z.string(),
    showGridLines: z.boolean(),
    defaultDateRange: TimeRangeValueSchema,
    dataRetentionDays: z.number().int().min(MIN_DATA_RETENTION_DAYS),
    retentionGraceUntil: z.date().nullable(),
    retentionGraceRestoreDays: z.number().int().positive().nullable(),
    weeklyReports: z.boolean(),
    weeklyReportDay: z.number().int().min(1).max(7),
    weeklyReportRecipients: z.array(z.string().email()),
    monthlyReports: z.boolean(),
    monthlyReportRecipients: z.array(z.string().email()),
    alertsEnabled: z.boolean(),
    alertsThreshold: z.number().int().positive(),
  })
  .strict();

export const DashboardSettingsUpdateSchema = z.object({
  showGridLines: z.boolean().optional(),
  defaultDateRange: TimeRangeValueSchema.optional(),
  dataRetentionDays: z.number().int().min(MIN_DATA_RETENTION_DAYS).optional(),
  weeklyReports: z.boolean().optional(),
  weeklyReportDay: z.number().int().min(1).max(7).optional(),
  weeklyReportRecipients: z.array(z.string().email()).max(MAX_REPORT_RECIPIENTS).optional(),
  monthlyReports: z.boolean().optional(),
  monthlyReportRecipients: z.array(z.string().email()).max(MAX_REPORT_RECIPIENTS).optional(),
  alertsEnabled: z.boolean().optional(),
  alertsThreshold: z.number().int().positive().optional(),
});

export const DashboardSettingsInternalPatchSchema = DashboardSettingsUpdateSchema.extend({
  retentionGraceUntil: z.date().nullable().optional(),
  retentionGraceRestoreDays: z.number().int().positive().nullable().optional(),
});

export const DashboardWithReportSettingsSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  weeklyReports: z.boolean(),
  weeklyReportDay: z.number().int().min(1).max(7),
  weeklyReportRecipients: z.array(z.string().email()),
  monthlyReports: z.boolean(),
  monthlyReportRecipients: z.array(z.string().email()),
  lastWeeklyReportSentAt: z.date().nullable(),
  lastMonthlyReportSentAt: z.date().nullable(),
  dashboard: z.object({
    id: z.string(),
    siteId: z.string(),
    domain: z.string(),
  }),
});

export const RetentionPurgeCandidateSchema = z.object({
  siteId: z.string(),
  createdAt: z.date(),
  dataRetentionDays: z.number().int().min(MIN_DATA_RETENTION_DAYS),
  retentionGraceUntil: z.date().nullable(),
  retentionGraceRestoreDays: z.number().int().positive().nullable(),
});

export const RetentionClampResultSchema = z.object({
  affectedCount: z.number().int().nonnegative(),
  previousMaxRetention: z.number().int().positive().nullable(),
});

export const OwnerRetentionSettingsRowSchema = z.object({
  id: z.string(),
  dataRetentionDays: z.number().int().min(MIN_DATA_RETENTION_DAYS),
  retentionGraceRestoreDays: z.number().int().positive().nullable(),
});

export const RetentionSettingsPatchSchema = z.object({
  settingsId: z.string(),
  dataRetentionDays: z.number().int().min(MIN_DATA_RETENTION_DAYS).optional(),
  retentionGraceRestoreDays: z.number().int().positive().nullable().optional(),
  retentionGraceUntil: z.date().nullable().optional(),
});

// These are also defined at database level
export const DEFAULT_DASHBOARD_SETTINGS: Omit<
  DashboardSettings,
  'id' | 'dashboardId' | 'createdAt' | 'updatedAt' | 'lastWeeklyReportSentAt' | 'lastMonthlyReportSentAt'
> = {
  showGridLines: true,
  defaultDateRange: '7d',
  dataRetentionDays: 365,
  retentionGraceUntil: null,
  retentionGraceRestoreDays: null,
  weeklyReports: false,
  weeklyReportDay: 1,
  weeklyReportRecipients: [],
  monthlyReports: false,
  monthlyReportRecipients: [],
  alertsEnabled: false,
  alertsThreshold: 1000,
};

export type DashboardSettingsUpdate = z.infer<typeof DashboardSettingsUpdateSchema>;
export type DashboardSettingsInternalPatch = z.infer<typeof DashboardSettingsInternalPatchSchema>;
export type DashboardSettings = z.infer<typeof DashboardSettingsSchema>;
export type DashboardSettingsCreate = z.infer<typeof DashboardSettingsCreateSchema>;
export type DashboardWithReportSettings = z.infer<typeof DashboardWithReportSettingsSchema>;
export type RetentionPurgeCandidate = z.infer<typeof RetentionPurgeCandidateSchema>;
export type RetentionClampResult = z.infer<typeof RetentionClampResultSchema>;
export type OwnerRetentionSettingsRow = z.infer<typeof OwnerRetentionSettingsRowSchema>;
export type RetentionSettingsPatch = z.infer<typeof RetentionSettingsPatchSchema>;
