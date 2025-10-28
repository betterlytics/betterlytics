import prisma from '@/lib/postgres';
import {
  DashboardConfig,
  DashboardConfigSchema,
  DashboardConfigCreate,
  DashboardConfigUpdate,
  withDashboardConfigCreateDefaults,
} from '@/entities/dashboardConfig';

export async function findDashboardConfigByDashboardId(dashboardId: string): Promise<DashboardConfig | null> {
  try {
    const cfg = await prisma.dashboardConfig.findUnique({ where: { dashboardId } });
    if (!cfg) return null;
    return DashboardConfigSchema.parse(cfg);
  } catch (error) {
    console.error('Error finding dashboard config by dashboardId:', error);
    throw new Error('Failed to find dashboard config');
  }
}

export async function createDashboardConfig(input: DashboardConfigCreate): Promise<DashboardConfig> {
  try {
    const { dashboardId, ...data } = input;
    const cfg = await prisma.dashboardConfig.create({
      data: { dashboardId, ...data },
    });
    return DashboardConfigSchema.parse(cfg);
  } catch (error) {
    console.error('Error creating dashboard config:', error);
    throw new Error('Failed to create dashboard config');
  }
}

export async function updateDashboardConfig(
  dashboardId: string,
  input: DashboardConfigUpdate,
): Promise<DashboardConfig> {
  try {
    const cfg = await prisma.dashboardConfig.update({
      where: { dashboardId },
      data: { ...input },
    });
    return DashboardConfigSchema.parse(cfg);
  } catch (error) {
    console.error('Error updating dashboard config:', error);
    throw new Error('Failed to update dashboard config');
  }
}

export async function findOrCreateDashboardConfig(dashboardId: string): Promise<DashboardConfig> {
  const existing = await findDashboardConfigByDashboardId(dashboardId);
  if (existing) return existing;
  const input = withDashboardConfigCreateDefaults(dashboardId);
  return await createDashboardConfig(input);
}

export async function createDashboardConfigs(dashboardIds: string[]): Promise<DashboardConfig[]> {
  if (dashboardIds.length === 0) return [];
  try {
    const data = dashboardIds.map((dashboardId) => ({
      dashboardId,
      blacklistedIps: [],
      enforceDomain: true,
    }));
    const result = await prisma.dashboardConfig.createManyAndReturn({ data, skipDuplicates: true });
    return result.map((c) => DashboardConfigSchema.parse(c));
  } catch (error) {
    console.error('Error creating many dashboard configs:', error);
    throw new Error('Failed to create many dashboard configs');
  }
}
