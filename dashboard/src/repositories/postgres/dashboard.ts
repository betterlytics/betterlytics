import prisma from '@/lib/postgres';
import {
  Dashboard,
  DashboardFindByUserData,
  DashboardFindByUserSchema,
  DashboardSchema,
  DashboardUser,
  DashboardUserSchema,
  DashboardWriteData,
  DashboardWriteSchema,
} from '@/entities/dashboard';
import { DEFAULT_DASHBOARD_SETTINGS } from '@/entities/dashboardSettings';

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
