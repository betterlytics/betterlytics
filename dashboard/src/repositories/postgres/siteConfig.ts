import prisma from '@/lib/postgres';
import { SiteConfig, SiteConfigSchema, SiteConfigUpdate } from '@/entities/dashboard/siteConfig';

export async function findSiteConfigByDashboardId(dashboardId: string): Promise<SiteConfig | null> {
  try {
    const cfg = await prisma.siteConfig.findUnique({ where: { dashboardId } });
    if (!cfg) return null;
    return SiteConfigSchema.parse(cfg);
  } catch (error) {
    console.error('Error finding site config by dashboardId:', error);
    throw new Error('Failed to find site config');
  }
}

export async function updateSiteConfig(dashboardId: string, input: SiteConfigUpdate): Promise<SiteConfig> {
  try {
    const cfg = await prisma.siteConfig.update({
      where: { dashboardId },
      data: { ...input },
    });
    return SiteConfigSchema.parse(cfg);
  } catch (error) {
    console.error('Error updating site config:', error);
    throw new Error('Failed to update site config');
  }
}
