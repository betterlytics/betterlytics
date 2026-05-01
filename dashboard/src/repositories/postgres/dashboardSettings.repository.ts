import prisma from '@/lib/postgres';
import {
  DashboardSettings,
  DashboardSettingsSchema,
  DashboardSettingsUpdate,
  DashboardSettingsUpdateSchema,
  DashboardSettingsCreateSchema,
  DashboardWithReportSettings,
  DashboardWithReportSettingsSchema,
  RetentionPurgeTarget,
  RetentionClampResult,
} from '@/entities/dashboard/dashboardSettings.entities';

export async function findSettingsByDashboardId(dashboardId: string): Promise<DashboardSettings | null> {
  try {
    const prismaSettings = await prisma.dashboardSettings.findUnique({
      where: { dashboardId },
    });

    if (!prismaSettings) {
      return null;
    }

    return DashboardSettingsSchema.parse(prismaSettings);
  } catch (error) {
    console.error('Error finding settings by dashboard ID:', error);
    throw new Error('Failed to find dashboard settings');
  }
}

export async function updateSettings(
  dashboardId: string,
  updates: DashboardSettingsUpdate,
): Promise<DashboardSettings> {
  try {
    const validatedUpdates = DashboardSettingsUpdateSchema.parse(updates);

    const data = Object.fromEntries(Object.entries(validatedUpdates).filter(([, value]) => value !== undefined));

    const updatedSettings = await prisma.dashboardSettings.update({
      where: { dashboardId },
      data,
    });

    return DashboardSettingsSchema.parse(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update dashboard settings');
  }
}

export async function createSettings(
  dashboardId: string,
  settings: DashboardSettingsUpdate,
): Promise<DashboardSettings> {
  try {
    const validatedSettings = DashboardSettingsCreateSchema.parse({
      ...settings,
      dashboardId,
    });

    const createdSettings = await prisma.dashboardSettings.create({
      data: validatedSettings,
    });

    return DashboardSettingsSchema.parse(createdSettings);
  } catch (error) {
    console.error('Error creating settings:', error);
    throw new Error('Failed to create dashboard settings');
  }
}

export async function findDashboardsWithReportsEnabled(): Promise<DashboardWithReportSettings[]> {
  try {
    const settings = await prisma.dashboardSettings.findMany({
      where: {
        OR: [{ weeklyReports: true }, { monthlyReports: true }],
        dashboard: {
          deletedAt: null,
        },
      },
      include: {
        dashboard: {
          select: {
            id: true,
            siteId: true,
            domain: true,
          },
        },
      },
    });

    return settings
      .filter((s) => s.weeklyReportRecipients.length > 0 || s.monthlyReportRecipients.length > 0)
      .map((s) =>
        DashboardWithReportSettingsSchema.parse({
          id: s.id,
          dashboardId: s.dashboardId,
          weeklyReports: s.weeklyReports,
          weeklyReportDay: s.weeklyReportDay,
          weeklyReportRecipients: s.weeklyReportRecipients,
          monthlyReports: s.monthlyReports,
          monthlyReportRecipients: s.monthlyReportRecipients,
          lastWeeklyReportSentAt: s.lastWeeklyReportSentAt,
          lastMonthlyReportSentAt: s.lastMonthlyReportSentAt,
          dashboard: s.dashboard,
        }),
      );
  } catch (error) {
    console.error('Error finding dashboards with reports enabled:', error);
    throw new Error('Failed to find dashboards with reports enabled');
  }
}

export async function updateWeeklyReportSentAt(settingsId: string): Promise<void> {
  try {
    await prisma.dashboardSettings.update({
      where: { id: settingsId },
      data: { lastWeeklyReportSentAt: new Date() },
    });
  } catch (error) {
    console.error('Error updating weekly report sent timestamp:', error);
    throw new Error('Failed to update weekly report sent timestamp');
  }
}

export async function updateMonthlyReportSentAt(settingsId: string): Promise<void> {
  try {
    await prisma.dashboardSettings.update({
      where: { id: settingsId },
      data: { lastMonthlyReportSentAt: new Date() },
    });
  } catch (error) {
    console.error('Error updating monthly report sent timestamp:', error);
    throw new Error('Failed to update monthly report sent timestamp');
  }
}

export async function findRetentionPurgeTargets(): Promise<RetentionPurgeTarget[]> {
  try {
    const rows = await prisma.dashboard.findMany({
      where: {
        deletedAt: null,
        settings: { isNot: null },
      },
      select: {
        siteId: true,
        createdAt: true,
        settings: {
          select: {
            dataRetentionDays: true,
            retentionGraceUntil: true,
            retentionGraceFloorDays: true,
          },
        },
      },
    });

    const now = Date.now();
    const targets: RetentionPurgeTarget[] = [];
    for (const row of rows) {
      const s = row.settings;
      if (!s || s.dataRetentionDays <= 0) continue;

      const graceActive =
        s.retentionGraceUntil != null &&
        s.retentionGraceUntil.getTime() > now &&
        s.retentionGraceFloorDays != null &&
        s.retentionGraceFloorDays > s.dataRetentionDays;

      const effectiveRetentionDays = graceActive ? s.retentionGraceFloorDays! : s.dataRetentionDays;
      const retentionCutoff = now - effectiveRetentionDays * 24 * 60 * 60 * 1000;

      if (row.createdAt.getTime() > retentionCutoff) continue;

      targets.push({
        siteId: row.siteId,
        effectiveRetentionDays,
        graceActive,
      });
    }
    return targets;
  } catch (error) {
    console.error('Error loading retention purge targets:', error);
    throw new Error('Failed to load retention purge targets');
  }
}

export async function clampOwnerRetentionAboveCeiling(
  userId: string,
  newMaxDays: number,
  graceUntil: Date,
): Promise<RetentionClampResult> {
  try {
    const affected = await prisma.dashboardSettings.findMany({
      where: {
        dataRetentionDays: { gt: newMaxDays },
        dashboard: {
          deletedAt: null,
          userAccess: { some: { userId, role: 'owner' } },
        },
      },
      select: { id: true, dataRetentionDays: true },
    });

    if (affected.length === 0) {
      return { affectedCount: 0, previousMaxRetention: 0 };
    }

    await prisma.$transaction(
      affected.map((s) =>
        prisma.dashboardSettings.update({
          where: { id: s.id },
          data: {
            dataRetentionDays: newMaxDays,
            retentionGraceFloorDays: s.dataRetentionDays,
            retentionGraceUntil: graceUntil,
          },
        }),
      ),
    );

    return {
      affectedCount: affected.length,
      previousMaxRetention: Math.max(...affected.map((s) => s.dataRetentionDays)),
    };
  } catch (error) {
    console.error(`Error clamping owner retention for user ${userId}:`, error);
    throw new Error(`Failed to clamp owner retention for user ${userId}`);
  }
}

export async function liftRetentionGraceClamp(userId: string, newMaxDays: number): Promise<void> {
  try {
    const restorable = await prisma.dashboardSettings.findMany({
      where: {
        retentionGraceUntil: { gt: new Date() },
        retentionGraceFloorDays: { not: null },
        dashboard: {
          deletedAt: null,
          userAccess: { some: { userId, role: 'owner' } },
        },
      },
      select: { id: true, retentionGraceFloorDays: true },
    });

    if (restorable.length === 0) return;

    await prisma.$transaction(
      restorable.map((s) =>
        prisma.dashboardSettings.update({
          where: { id: s.id },
          data: {
            dataRetentionDays: Math.min(s.retentionGraceFloorDays!, newMaxDays),
            retentionGraceFloorDays: null,
            retentionGraceUntil: null,
          },
        }),
      ),
    );
  } catch (error) {
    console.error(`Error lifting retention grace clamp for user ${userId}:`, error);
    throw new Error(`Failed to lift retention grace clamp for user ${userId}`);
  }
}
