'use server';
import { type DashboardConfigUpdate, DashboardConfigSchema } from '@/entities/dashboardConfig';
import {
  updateDashboardConfig,
  findDashboardConfigByDashboardId,
  findOrCreateDashboardConfig,
} from '@/repositories/postgres/dashboardConfig';
import { findDashboardById } from '@/repositories/postgres/dashboard';
import { publishConfigInvalidation, writeConfigToRedis } from '@/repositories/redisConfigRepository';

export async function saveDashboardConfig(dashboardId: string, updates: DashboardConfigUpdate) {
  const cfg = await updateDashboardConfig(dashboardId, updates);

  const validated = DashboardConfigSchema.parse(cfg);
  const dashboard = await findDashboardById(dashboardId);
  await writeConfigToRedis(dashboard.siteId, validated, dashboard.domain);
  await publishConfigInvalidation(dashboard.siteId, Number(validated.updatedAt));
  return validated;
}

export async function getDashboardConfig(dashboardId: string) {
  const cfg = await findDashboardConfigByDashboardId(dashboardId);
  return cfg ? DashboardConfigSchema.parse(cfg) : null;
}

/**
 * Reads the config from Postgres and mirrors it to Redis without changes.
 */
export async function republishDashboardConfig(dashboardId: string) {
  const cfg = await findDashboardConfigByDashboardId(dashboardId);
  if (!cfg) return null;
  const validated = DashboardConfigSchema.parse(cfg);
  const dashboard = await findDashboardById(dashboardId);
  await writeConfigToRedis(dashboard.siteId, validated, dashboard.domain);
  await publishConfigInvalidation(dashboard.siteId, Number(validated.updatedAt));
  return validated;
}

/**
 * Ensures a config exists; creates with defaults if missing, then mirrors to Redis and publishes.
 */
export async function ensureDashboardConfig(dashboardId: string) {
  const cfg = await findOrCreateDashboardConfig(dashboardId);
  const validated = DashboardConfigSchema.parse(cfg);
  const dashboard = await findDashboardById(dashboardId);
  await writeConfigToRedis(dashboard.siteId, validated, dashboard.domain);
  await publishConfigInvalidation(dashboard.siteId, Number(validated.updatedAt));
  return validated;
}
