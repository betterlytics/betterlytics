import prisma from '@/lib/postgres';
import {
  Dashboard,
  DashboardFindByUserData,
  DashboardFindByUserSchema,
  DashboardSchema,
  DashboardUser,
  DashboardUserSchema,
  DashboardWithMemberCount,
  DashboardWithMemberCountSchema,
  DashboardWithSiteConfig,
  DashboardWithSiteConfigSchema,
  DashboardWriteData,
  DashboardWriteSchema,
} from '@/entities/dashboard/dashboard.entities';
import { DEFAULT_DASHBOARD_SETTINGS } from '@/entities/dashboard/dashboardSettings.entities';
import { DEFAULT_SITE_CONFIG_VALUES } from '@/entities/dashboard/siteConfig.entities';
import { DashboardMember, DashboardMemberSchema } from '@/entities/dashboard/invitation.entities';
import { DashboardRole } from '@prisma/client';

export async function findDashboardById(dashboardId: string): Promise<Dashboard> {
  try {
    const prismaDashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, deletedAt: null },
    });
    return DashboardSchema.parse(prismaDashboard);
  } catch {
    console.error('Error while finding dashboard relation');
    throw new Error('Failed to find user dashboard');
  }
}

export async function findUserDashboardOrNull(data: DashboardFindByUserData): Promise<DashboardUser | null> {
  const validatedData = DashboardFindByUserSchema.parse(data);

  const prismaUserDashboard = await prisma.userDashboard.findFirst({
    where: {
      dashboardId: validatedData.dashboardId,
      userId: validatedData.userId,
      dashboard: { deletedAt: null },
    },
  });

  if (!prismaUserDashboard) return null;

  return DashboardUserSchema.parse(prismaUserDashboard);
}

export async function findUserDashboardWithDashboardOrNull(data: DashboardFindByUserData) {
  const rel = await prisma.userDashboard.findFirst({
    where: { dashboardId: data.dashboardId, userId: data.userId, dashboard: { deletedAt: null } },
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
        dashboard: { deletedAt: null },
      },
      include: {
        dashboard: true,
      },
    });

    if (prismaUserDashboard === null) {
      return null;
    }

    return DashboardSchema.parse(prismaUserDashboard.dashboard);
  } catch {
    console.error("Error while finding user's first dashboard");
    throw new Error('Faild to find dashboard');
  }
}

export async function findAllUserDashboards(userId: string): Promise<DashboardWithMemberCount[]> {
  try {
    const prismaUserDashboards = await prisma.userDashboard.findMany({
      where: {
        userId,
        dashboard: { deletedAt: null },
      },
      include: {
        dashboard: {
          include: {
            _count: {
              select: { userAccess: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prismaUserDashboards.map((userDashboard) =>
      DashboardWithMemberCountSchema.parse({
        ...userDashboard.dashboard,
        memberCount: userDashboard.dashboard._count.userAccess,
      }),
    );
  } catch (error) {
    console.error("Error while finding user's dashboards:", error);
    throw new Error('Failed to find user dashboards');
  }
}

export async function findOwnedDashboards(userId: string): Promise<Dashboard[]> {
  try {
    const prismaUserDashboards = await prisma.userDashboard.findMany({
      where: {
        userId,
        role: 'owner',
        dashboard: { deletedAt: null },
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
    console.error("Error while finding user's owned dashboards:", error);
    throw new Error('Failed to find owned dashboards');
  }
}

export async function findMemberDashboardsCount(userId: string): Promise<number> {
  try {
    const prismaUserDashboards = await prisma.userDashboard.count({
      where: {
        userId,
        role: { notIn: ['owner'] },
        dashboard: { deletedAt: null },
      },
    });

    return prismaUserDashboards;
  } catch (error) {
    console.error("Error while finding user's member dashboards count:", error);
    throw new Error('Failed to find member dashboards count');
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
            role: 'owner',
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
      where: { userId, dashboard: { deletedAt: null } },
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

export async function findDashboardOwner(dashboardId: string): Promise<{ userId: string } | null> {
  try {
    const owner = await prisma.userDashboard.findFirst({
      where: {
        dashboardId,
        role: 'owner',
        dashboard: { deletedAt: null },
      },
      select: { userId: true },
    });
    return owner;
  } catch (error) {
    console.error('Error finding dashboard owner:', error);
    return null;
  }
}

export async function getOwnedSiteIds(userId: string, includeDeleted = false): Promise<string[]> {
  try {
    const dashboards = await prisma.userDashboard.findMany({
      where: {
        userId,
        role: 'owner',
        dashboard: includeDeleted ? {} : { deletedAt: null },
      },
      include: {
        dashboard: {
          select: { siteId: true },
        },
      },
    });

    return dashboards.map((userDashboard) => userDashboard.dashboard.siteId);
  } catch (error) {
    console.error('Failed to get owned site IDs:', error);
    return [];
  }
}

export async function deleteDashboard(dashboardId: string): Promise<void> {
  try {
    await prisma.dashboard.update({
      where: { id: dashboardId },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    console.error(`Error deleting dashboard ${dashboardId}:`, error);
    throw new Error(`Failed to delete dashboard ${dashboardId}.`);
  }
}

export async function deleteOwnedDashboards(userId: string): Promise<string[]> {
  try {
    const ownedDashboards = await prisma.userDashboard.findMany({
      where: { userId, role: 'owner', dashboard: { deletedAt: null } },
      select: { dashboardId: true },
    });

    const dashboardIds = ownedDashboards.map((d) => d.dashboardId);

    if (dashboardIds.length > 0) {
      await prisma.dashboard.updateMany({
        where: { id: { in: dashboardIds } },
        data: { deletedAt: new Date() },
      });
    }

    return dashboardIds;
  } catch (error) {
    console.error(`Error deleting owned dashboards for user ${userId}:`, error);
    throw new Error('Failed to delete owned dashboards');
  }
}

export async function findAllDashboardIds(): Promise<string[]> {
  try {
    const dashboards = await prisma.dashboard.findMany({ where: { deletedAt: null }, select: { id: true } });
    return dashboards.map((d) => d.id);
  } catch (error) {
    console.error('Error fetching all dashboard ids:', error);
    throw new Error('Failed to fetch dashboard ids');
  }
}

export async function findAllDashboardsWithSiteConfig(): Promise<DashboardWithSiteConfig[]> {
  try {
    const dashboards = await prisma.dashboard.findMany({
      where: { deletedAt: null },
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

export async function findDashboardMembers(dashboardId: string): Promise<DashboardMember[]> {
  try {
    const members = await prisma.userDashboard.findMany({
      where: { dashboardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return members.map((m) => DashboardMemberSchema.parse(m));
  } catch (error) {
    console.error('Error finding dashboard members:', error);
    throw new Error('Failed to find dashboard members');
  }
}

export async function addDashboardMember(
  dashboardId: string,
  userId: string,
  role: DashboardRole,
): Promise<DashboardMember> {
  try {
    const member = await prisma.userDashboard.create({
      data: {
        dashboardId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return DashboardMemberSchema.parse(member);
  } catch (error) {
    console.error('Error adding dashboard member:', error);
    throw new Error('Failed to add dashboard member');
  }
}

export async function updateMemberRole(
  dashboardId: string,
  userId: string,
  role: DashboardRole,
): Promise<DashboardMember> {
  try {
    const member = await prisma.userDashboard.update({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return DashboardMemberSchema.parse(member);
  } catch (error) {
    console.error('Error updating member role:', error);
    throw new Error('Failed to update member role');
  }
}

export async function removeMember(dashboardId: string, userId: string): Promise<void> {
  try {
    await prisma.userDashboard.delete({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
    });
  } catch (error) {
    console.error('Error removing member:', error);
    throw new Error('Failed to remove member');
  }
}
