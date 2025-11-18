import { z } from 'zod';

export const SiteConfigSchema = z
  .object({
    id: z.string(),
    dashboardId: z.string(),
    blacklistedIps: z.array(z.string()),
    enforceDomain: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const SiteConfigCreateSchema = z
  .object({
    dashboardId: z.string(),
    blacklistedIps: z.array(z.string()).default([]),
    enforceDomain: z.boolean().default(false),
  })
  .strict();

export const SiteConfigUpdateSchema = z.object({
  blacklistedIps: z.array(z.string()).optional(),
  enforceDomain: z.boolean().optional(),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type SiteConfigCreate = z.infer<typeof SiteConfigCreateSchema>;
export type SiteConfigUpdate = z.infer<typeof SiteConfigUpdateSchema>;

/**
 * Applies Zod defaults for SiteConfigCreate
 */
export function withSiteConfigCreateDefaults(dashboardId: string): SiteConfigCreate {
  return SiteConfigCreateSchema.parse({ dashboardId });
}
