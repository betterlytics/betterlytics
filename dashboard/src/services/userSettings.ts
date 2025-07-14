'server-only';

import { UpdateUserData } from '@/entities/user';
import { UserSettings, UserSettingsUpdate, DEFAULT_USER_SETTINGS } from '@/entities/userSettings';
import * as UserSettingsRepository from '@/repositories/postgres/userSettings';
import * as UserRepository from '@/repositories/postgres/user';
import { UserException } from '@/lib/exceptions';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const settings = await UserSettingsRepository.findSettingsByUserId(userId);

    if (!settings) {
      return await UserSettingsRepository.createUserSettings(userId, DEFAULT_USER_SETTINGS);
    }

    return settings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw new Error('Failed to get user settings');
  }
}

export async function updateUserSettings(userId: string, updates: UserSettingsUpdate): Promise<UserSettings> {
  try {
    return await UserSettingsRepository.updateUserSettings(userId, updates);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw new Error('Failed to update user settings');
  }
}

export async function updateUser(userId: string, data: UpdateUserData): Promise<void> {
  try {
    await UserRepository.updateUser(userId, data);

    console.log(`Successfully updated user ${userId}`);
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw new Error('Failed to update user');
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await UserRepository.deleteUser(userId);
    console.log(`Successfully deleted user ${userId} and all associated data`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new Error('Failed to delete user account and associated data');
  }
}

export async function changeUserPassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  try {
    const isOldPasswordValid = await UserRepository.verifyUserPassword(userId, oldPassword);

    if (!isOldPasswordValid) {
      throw new UserException('Current password is incorrect');
    }

    await UserRepository.updateUserPassword(userId, newPassword);

    console.log(`Successfully updated password for user ${userId}`);
  } catch (error) {
    if (error instanceof UserException) {
      throw error;
    }

    console.error(`Error changing password for user ${userId}:`, error);
    throw new UserException('Failed to change password');
  }
}
