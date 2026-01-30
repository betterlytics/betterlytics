import prisma from '@/lib/postgres';
import {
  DashboardSettings,
  DashboardSettingsSchema,
  DashboardSettingsUpdate,
  DashboardSettingsUpdateSchema,
  DashboardSettingsCreateSchema,
  DashboardWithReportSettings,
  DashboardWithReportSettingsSchema,
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
      .filter((s) => s.reportRecipients.length > 0)
      .map((s) =>
        DashboardWithReportSettingsSchema.parse({
          id: s.id,
          dashboardId: s.dashboardId,
          weeklyReports: s.weeklyReports,
          weeklyReportDay: s.weeklyReportDay,
          monthlyReports: s.monthlyReports,
          reportRecipients: s.reportRecipients,
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
