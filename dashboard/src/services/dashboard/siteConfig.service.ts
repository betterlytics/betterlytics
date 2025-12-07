'use server';
import { SiteConfigUpdate } from '@/entities/dashboard/siteConfig.entities';
import { updateSiteConfig, findSiteConfigByDashboardId } from '@/repositories/postgres/siteConfig.repository';

export async function saveSiteConfig(dashboardId: string, updates: SiteConfigUpdate) {
  return await updateSiteConfig(dashboardId, updates);
}

export async function getSiteConfig(dashboardId: string) {
  return await findSiteConfigByDashboardId(dashboardId);
}
