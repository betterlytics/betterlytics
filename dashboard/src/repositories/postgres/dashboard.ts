import prisma from '@/lib/postgres';
import {
  Dashboard,
  DashboardFindByUserData,
  DashboardFindByUserSchema,
  DashboardSchema,
  DashboardUser,
  DashboardUserSchema,
  DashboardWithSiteConfig,
  DashboardWithSiteConfigSchema,
  DashboardWriteData,
  DashboardWriteSchema,
} from '@/entities/dashboard/dashboard';
import { DEFAULT_DASHBOARD_SETTINGS } from '@/entities/dashboard/dashboardSettings';
import { DEFAULT_SITE_CONFIG_VALUES } from '@/entities/dashboard/siteConfig';

export async function findDashboardById(dashboardId: string): Promise<Dashboard> {
  try {
    const prismaDashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId },
    });
    return DashboardSchema.parse(prismaDashboard);
  } catch {
    console.error('Error while finding dashboard relation');
    throw new Error('Failed to find user dashboard');
  }
}

export async function findUserDashboard(data: DashboardFindByUserData): Promise<DashboardUser> {
  try {
    const validatedData = DashboardFindByUserSchema.parse(data);

    const prismaUserDashboard = await prisma.userDashboard.findFirst({
      where: {
        dashboardId: validatedData.dashboardId,
        userId: validatedData.userId,
      },
    });

    return DashboardUserSchema.parse(prismaUserDashboard);
  } catch {
    console.error('Error while finding dashboard relation');
    throw new Error('Failed to find user dashboard');
  }
}

export async function findUserDashboardWithDashboardOrNull(data: DashboardFindByUserData) {
  const rel = await prisma.userDashboard.findFirst({
    where: { dashboardId: data.dashboardId, userId: data.userId },
    include: { dashboard: true },
  });

  if (rel === null) return null;

  return {
    dashboardUser: DashboardUserSchema.parse(rel),
    dashboard: DashboardSchema.parse(rel.dashboard),
  };
}

export async function findFirstUserDashboard(userId: string): Promise<Dashboard | null> {
  try {
    const prismaUserDashboard = await prisma.userDashboard.findFirst({
      where: {
        userId,
      },
    });

    if (prismaUserDashboard === null) {
      return null;
    }

    const prismaDashboard = await prisma.dashboard.findFirst({
      where: {
        id: prismaUserDashboard?.dashboardId,
      },
    });

    if (prismaDashboard === null) {
      return null;
    }

    return DashboardSchema.parse(prismaDashboard);
  } catch {
    console.error("Error while finding user's first dashboard");
    throw new Error('Faild to find dashboard');
  }
}

export async function findAllUserDashboards(userId: string): Promise<Dashboard[]> {
  try {
    const prismaUserDashboards = await prisma.userDashboard.findMany({
      where: {
        userId,
      },
      include: {
        dashboard: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prismaUserDashboards.map((userDashboard) => DashboardSchema.parse(userDashboard.dashboard));
  } catch (error) {
    console.error("Error while finding user's dashboards:", error);
    throw new Error('Failed to find user dashboards');
  }
}

export async function createDashboard(data: DashboardWriteData): Promise<Dashboard> {
  try {
    const validatedData = DashboardWriteSchema.parse(data);

    const prismaDashboard = await prisma.dashboard.create({
      data: {
        domain: validatedData.domain,
        siteId: validatedData.siteId,
        userAccess: {
          create: {
            userId: validatedData.userId,
            role: 'admin',
          },
        },
        settings: {
          create: {
            ...DEFAULT_DASHBOARD_SETTINGS,
          },
        },
        config: {
          create: {
            ...DEFAULT_SITE_CONFIG_VALUES,
          },
        },
      },
    });

    return DashboardSchema.parse(prismaDashboard);
  } catch (error) {
    console.error('Error creating dashboard:', error);
    throw new Error('Failed to create dashboard.');
  }
}

export async function getUserSiteIds(userId: string): Promise<string[]> {
  try {
    const dashboards = await prisma.userDashboard.findMany({
      where: { userId },
      include: {
        dashboard: {
          select: { siteId: true },
        },
      },
    });

    return dashboards.map((userDashboard) => userDashboard.dashboard.siteId);
  } catch (error) {
    console.error('Failed to get user site IDs:', error);
    return [];
  }
}

export async function deleteDashboard(dashboardId: string): Promise<void> {
  try {
    await prisma.dashboard.delete({
      where: { id: dashboardId },
    });
  } catch (error) {
    console.error(`Error deleting dashboard ${dashboardId}:`, error);
    throw new Error(`Failed to delete dashboard ${dashboardId}.`);
  }
}

export async function findAllDashboardIds(): Promise<string[]> {
  try {
    const dashboards = await prisma.dashboard.findMany({ select: { id: true } });
    return dashboards.map((d) => d.id);
  } catch (error) {
    console.error('Error fetching all dashboard ids:', error);
    throw new Error('Failed to fetch dashboard ids');
  }
}

export async function findAllDashboardsWithSiteConfig(): Promise<DashboardWithSiteConfig[]> {
  try {
    const dashboards = await prisma.dashboard.findMany({
      select: {
        id: true,
        siteId: true,
        domain: true,
        config: true,
      },
    });
    return dashboards.map((d) =>
      DashboardWithSiteConfigSchema.parse({
        dashboardId: d.id,
        siteId: d.siteId,
        domain: d.domain,
        config: d.config,
      }),
    );
  } catch (error) {
    console.error('Error fetching dashboards with config:', error);
    throw new Error('Failed to fetch dashboards with config');
  }
}
