import { z } from "zod";
import { TIME_RANGE_PRESETS } from "@/utils/timeRanges";

export const TimeRangeValueSchema = z.enum(TIME_RANGE_PRESETS.map(preset => preset.value) as [string, ...string[]]);

export const DashboardSettingsSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  
  // Display Settings
  showGridLines: z.boolean(),
  defaultDateRange: TimeRangeValueSchema,
  
  // Data Settings
  dataRetentionDays: z.number().int().positive(),
  
  // Report Settings
  weeklyReports: z.boolean(),
  monthlyReports: z.boolean(),
  reportRecipients: z.array(z.string().email()),
  
  // Alert Settings
  alertsEnabled: z.boolean(),
  alertsThreshold: z.number().int().positive(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict();

export const DashboardSettingsCreateSchema = z.object({
  dashboardId: z.string(),
  showGridLines: z.boolean(),
  defaultDateRange: TimeRangeValueSchema,
  dataRetentionDays: z.number().int().positive(),
  weeklyReports: z.boolean(),
  monthlyReports: z.boolean(),
  reportRecipients: z.array(z.string().email()),
  alertsEnabled: z.boolean(),
  alertsThreshold: z.number().int().positive(),
}).strict();

export const DashboardSettingsUpdateSchema = z.object({
  showGridLines: z.boolean().optional(),
  defaultDateRange: TimeRangeValueSchema.optional(),
  dataRetentionDays: z.number().int().positive().optional(),
  weeklyReports: z.boolean().optional(),
  monthlyReports: z.boolean().optional(),
  reportRecipients: z.array(z.string().email()).optional(),
  alertsEnabled: z.boolean().optional(),
  alertsThreshold: z.number().int().positive().optional(),
});

// These are also defined at database level
export const DEFAULT_DASHBOARD_SETTINGS: Omit<DashboardSettings, "id" | "dashboardId" | "createdAt" | "updatedAt"> = {
  showGridLines: true,
  defaultDateRange: "7d",
  dataRetentionDays: 365,
  weeklyReports: true,
  monthlyReports: false,
  reportRecipients: [],
  alertsEnabled: false,
  alertsThreshold: 1000,
};

export type DashboardSettingsUpdate = z.infer<typeof DashboardSettingsUpdateSchema>;
export type DashboardSettings = z.infer<typeof DashboardSettingsSchema>;
export type DashboardSettingsCreate = z.infer<typeof DashboardSettingsCreateSchema>;