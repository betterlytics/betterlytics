import prisma from '@/lib/postgres';
import {
  DashboardSettings,
  DashboardSettingsSchema,
  DashboardSettingsUpdate,
  DashboardSettingsUpdateSchema,
  DashboardSettingsCreateSchema,
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
