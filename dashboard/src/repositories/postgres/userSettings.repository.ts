import prisma from '@/lib/postgres';
import {
  UserSettings,
  UserSettingsSchema,
  UserSettingsUpdate,
  UserSettingsCreateSchema,
} from '@/entities/account/userSettings.entities';

export async function findSettingsByUserId(userId: string): Promise<UserSettings | null> {
  try {
    const prismaSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!prismaSettings) {
      return null;
    }

    return UserSettingsSchema.parse(prismaSettings);
  } catch (error) {
    console.error('Error finding user settings by user ID:', error);
    throw new Error('Failed to find user settings');
  }
}

export async function updateUserSettings(userId: string, updates: UserSettingsUpdate): Promise<UserSettings> {
  try {
    const updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: updates,
    });

    return UserSettingsSchema.parse(updatedSettings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw new Error('Failed to update user settings');
  }
}

export async function createUserSettings(userId: string, settings: UserSettingsUpdate): Promise<UserSettings> {
  try {
    const validatedSettings = UserSettingsCreateSchema.parse({
      ...settings,
      userId,
    });

    const prismaSettings = await prisma.userSettings.upsert({
      where: { userId },
      create: validatedSettings,
      update: {},
    });

    return UserSettingsSchema.parse(prismaSettings);
  } catch (error) {
    console.error('Error creating user settings:', error);
    throw new Error('Failed to create user settings');
  }
}
