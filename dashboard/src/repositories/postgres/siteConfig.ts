import prisma from '@/lib/postgres';
import {
  SiteConfig,
  withSiteConfigCreateDefaults,
  SiteConfigCreate,
  SiteConfigSchema,
  SiteConfigUpdate,
} from '@/entities/siteConfig';

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

export async function createSiteConfig(input: SiteConfigCreate): Promise<SiteConfig> {
  try {
    const cfg = await prisma.siteConfig.create({
      data: input,
    });
    return SiteConfigSchema.parse(cfg);
  } catch (error) {
    console.error('Error creating site config:', error);
    throw new Error('Failed to create site config');
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

export async function findOrCreateSiteConfig(dashboardId: string): Promise<SiteConfig> {
  const existing = await findSiteConfigByDashboardId(dashboardId);
  if (existing) return existing;
  const input = withSiteConfigCreateDefaults(dashboardId);
  return await createSiteConfig(input);
}

export async function createSiteConfigs(dashboardIds: string[]): Promise<SiteConfig[]> {
  if (dashboardIds.length === 0) return [];
  try {
    const data = dashboardIds.map((dashboardId) => ({
      dashboardId,
      blacklistedIps: [],
      enforceDomain: false,
    }));
    const result = await prisma.siteConfig.createManyAndReturn({ data, skipDuplicates: true });
    return result.map((c) => SiteConfigSchema.parse(c));
  } catch (error) {
    console.error('Error creating many site configs:', error);
    throw new Error('Failed to create many site configs');
  }
}
