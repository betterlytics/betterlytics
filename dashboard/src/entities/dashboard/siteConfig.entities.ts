import { z } from 'zod';
import { GeoLevelSettingSchema } from './dashboardSettings.entities';

export const DEFAULT_SITE_CONFIG_VALUES: Omit<SiteConfig, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'> = {
  blacklistedIps: [],
  enforceDomain: false,
  geoLevel: 'COUNTRY' as const,
};

export const SiteConfigSchema = z
  .object({
    id: z.string(),
    dashboardId: z.string(),
    blacklistedIps: z.array(z.string()),
    enforceDomain: z.boolean(),
    geoLevel: GeoLevelSettingSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const SiteConfigUpdateSchema = z.object({
  blacklistedIps: z.array(z.string()).optional(),
  enforceDomain: z.boolean().optional(),
  geoLevel: GeoLevelSettingSchema.optional(),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type SiteConfigUpdate = z.infer<typeof SiteConfigUpdateSchema>;
