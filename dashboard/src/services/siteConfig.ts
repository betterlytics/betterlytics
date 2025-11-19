'use server';
import { SiteConfigUpdate } from '@/entities/siteConfig';
import {
  updateSiteConfig,
  findSiteConfigByDashboardId,
  findOrCreateSiteConfig,
} from '@/repositories/postgres/siteConfig';

export async function saveSiteConfig(dashboardId: string, updates: SiteConfigUpdate) {
  return await updateSiteConfig(dashboardId, updates);
}

export async function getSiteConfig(dashboardId: string) {
  return await findSiteConfigByDashboardId(dashboardId);
}

export async function ensureSiteConfig(dashboardId: string) {
  return await findOrCreateSiteConfig(dashboardId);
}
