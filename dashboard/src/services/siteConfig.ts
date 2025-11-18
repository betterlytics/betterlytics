'use server';
import { SiteConfigSchema, SiteConfigUpdate } from '@/entities/siteConfig';
import {
  updateSiteConfig,
  findSiteConfigByDashboardId,
  findOrCreateSiteConfig,
} from '@/repositories/postgres/siteConfig';
import { findDashboardById } from '@/repositories/postgres/dashboard';
import { publishConfigInvalidation, writeConfigToRedis } from '@/repositories/redisConfigRepository';

export async function saveSiteConfig(dashboardId: string, updates: SiteConfigUpdate) {
  const cfg = await updateSiteConfig(dashboardId, updates);

  const validated = SiteConfigSchema.parse(cfg);
  const dashboard = await findDashboardById(dashboardId);
  await writeConfigToRedis(dashboard.siteId, validated, dashboard.domain);
  await publishConfigInvalidation(dashboard.siteId, Number(validated.updatedAt));
  return validated;
}

export async function getSiteConfig(dashboardId: string) {
  const cfg = await findSiteConfigByDashboardId(dashboardId);
  return cfg ? SiteConfigSchema.parse(cfg) : null;
}

/**
 * Ensures a config exists; creates with defaults if missing, then mirrors to Redis and publishes.
 */
export async function ensureSiteConfig(dashboardId: string) {
  const cfg = await findOrCreateSiteConfig(dashboardId);
  const validated = SiteConfigSchema.parse(cfg);
  const dashboard = await findDashboardById(dashboardId);
  await writeConfigToRedis(dashboard.siteId, validated, dashboard.domain);
  await publishConfigInvalidation(dashboard.siteId, Number(validated.updatedAt));
  return validated;
}
