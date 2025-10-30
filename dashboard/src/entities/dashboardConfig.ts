import { z } from 'zod';

export const DashboardConfigSchema = z
  .object({
    id: z.string(),
    dashboardId: z.string(),
    blacklistedIps: z.array(z.string()),
    enforceDomain: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const DashboardConfigCreateSchema = z
  .object({
    dashboardId: z.string(),
    blacklistedIps: z.array(z.string()).default([]),
    enforceDomain: z.boolean().default(true),
  })
  .strict();

export const DashboardConfigUpdateSchema = z.object({
  blacklistedIps: z.array(z.string()).optional(),
  enforceDomain: z.boolean().optional(),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type DashboardConfigCreate = z.infer<typeof DashboardConfigCreateSchema>;
export type DashboardConfigUpdate = z.infer<typeof DashboardConfigUpdateSchema>;

/**
 * Applies Zod defaults for DashboardConfigCreate
 */
export function withDashboardConfigCreateDefaults(dashboardId: string): DashboardConfigCreate {
  return DashboardConfigCreateSchema.parse({ dashboardId });
}
