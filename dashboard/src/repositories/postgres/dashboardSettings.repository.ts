import prisma from '@/lib/postgres';
import {
  DashboardSettings,
  DashboardSettingsSchema,
  DashboardSettingsUpdate,
  DashboardSettingsInternalPatch,
  DashboardSettingsInternalPatchSchema,
  DashboardSettingsCreateSchema,
  DashboardWithReportSettings,
  DashboardWithReportSettingsSchema,
  RetentionPurgeCandidateSchema,
  RetentionPurgeCandidate,
  OwnerRetentionSettingsRow,
  OwnerRetentionSettingsRowSchema,
  RetentionSettingsPatch,
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
  patch: DashboardSettingsInternalPatch,
): Promise<DashboardSettings> {
  try {
    const validatedPatch = DashboardSettingsInternalPatchSchema.parse(patch);

    const data = Object.fromEntries(Object.entries(validatedPatch).filter(([, value]) => value !== undefined));

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

export async function findRetentionPurgeCandidates(createdBefore: Date): Promise<RetentionPurgeCandidate[]> {
  try {
    const rows = await prisma.dashboard.findMany({
      where: {
        deletedAt: null,
        createdAt: { lte: createdBefore },
        settings: { isNot: null },
      },
      select: {
        siteId: true,
        createdAt: true,
        settings: {
          select: {
            dataRetentionDays: true,
            retentionGraceUntil: true,
            retentionGraceRestoreDays: true,
          },
        },
      },
    });

    return rows.map((row) =>
      RetentionPurgeCandidateSchema.parse({
        siteId: row.siteId,
        createdAt: row.createdAt,
        dataRetentionDays: row.settings!.dataRetentionDays,
        retentionGraceUntil: row.settings!.retentionGraceUntil,
        retentionGraceRestoreDays: row.settings!.retentionGraceRestoreDays,
      }),
    );
  } catch (error) {
    console.error('Error loading retention purge candidates:', error);
    throw new Error('Failed to load retention purge candidates');
  }
}

export async function findOwnedDashboardDomainsExceedingRetention(
  userId: string,
  maxDays: number,
): Promise<string[]> {
  try {
    const rows = await prisma.dashboardSettings.findMany({
      where: {
        dataRetentionDays: { gt: maxDays },
        dashboard: {
          deletedAt: null,
          userAccess: { some: { userId, role: 'owner' } },
        },
      },
      select: { dashboard: { select: { domain: true } } },
    });
    return rows.map((r) => r.dashboard.domain);
  } catch (error) {
    console.error(`Error loading owned dashboards exceeding retention ${maxDays} for user ${userId}:`, error);
    throw new Error('Failed to load owned dashboards retention');
  }
}

export async function findOwnedDashboardDomainsWithActiveRetentionGrace(userId: string): Promise<string[]> {
  try {
    const rows = await prisma.dashboardSettings.findMany({
      where: {
        retentionGraceUntil: { gt: new Date() },
        retentionGraceRestoreDays: { not: null },
        dashboard: {
          deletedAt: null,
          userAccess: { some: { userId, role: 'owner' } },
        },
      },
      select: { dashboard: { select: { domain: true } } },
    });
    return rows.map((r) => r.dashboard.domain);
  } catch (error) {
    console.error(`Error loading owned dashboards with active retention grace for user ${userId}:`, error);
    throw new Error('Failed to load owned dashboards retention grace');
  }
}

export async function findOwnerSettingsForRetentionSync(
  userId: string,
  newMaxDays: number,
): Promise<OwnerRetentionSettingsRow[]> {
  try {
    const rows = await prisma.dashboardSettings.findMany({
      where: {
        dashboard: {
          deletedAt: null,
          userAccess: { some: { userId, role: 'owner' } },
        },
        OR: [
          { dataRetentionDays: { gt: newMaxDays } },
          { retentionGraceUntil: { gt: new Date() }, retentionGraceRestoreDays: { not: null } },
        ],
      },
      select: { id: true, dataRetentionDays: true, retentionGraceRestoreDays: true },
    });
    return rows.map((r) => OwnerRetentionSettingsRowSchema.parse(r));
  } catch (error) {
    console.error(`Error loading owner settings for retention sync for user ${userId}:`, error);
    throw new Error(`Failed to load owner settings for retention sync for user ${userId}`);
  }
}

export async function applyRetentionPatches(patches: RetentionSettingsPatch[]): Promise<void> {
  if (patches.length === 0) return;
  try {
    await prisma.$transaction(
      patches.map((p) => {
        const { settingsId, ...rest } = p;
        const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
        return prisma.dashboardSettings.update({ where: { id: settingsId }, data });
      }),
    );
  } catch (error) {
    console.error('Error applying retention patches:', error);
    throw new Error('Failed to apply retention patches');
  }
}
