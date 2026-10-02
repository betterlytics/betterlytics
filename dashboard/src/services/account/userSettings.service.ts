'server-only';

import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { UpdateUserData } from '@/entities/auth/user.entities';
import {
  AccountDeletionBlocker,
  UserSettings,
  UserSettingsUpdate,
  DEFAULT_USER_SETTINGS,
} from '@/entities/account/userSettings.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';
import * as UserSettingsRepository from '@/repositories/postgres/userSettings.repository';
import * as UserRepository from '@/repositories/postgres/user.repository';
import * as DashboardRepository from '@/repositories/postgres/dashboard.repository';
import * as InvitationRepository from '@/repositories/postgres/invitation.repository';
import type { SupportedLanguages } from '@/constants/i18n';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const settings = await UserSettingsRepository.findSettingsByUserId(userId);

    if (!settings) {
      return await createDefaultUserSettings(userId);
    }

    return settings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw new Error('Failed to get user settings');
  }
}

export const getCachedUserSettings = cache(getUserSettings);

export async function createDefaultUserSettings(
  userId: string,
  language?: SupportedLanguages,
): Promise<UserSettings> {
  try {
    return await UserSettingsRepository.createUserSettings(userId, {
      ...DEFAULT_USER_SETTINGS,
      ...(language && { language }),
    });
  } catch (error) {
    console.error('Error creating default user settings:', error);
    throw new Error('Failed to create default user settings');
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

// Gitea pattern: never leave a self-host instance without an admin; signup does not reopen
export async function getAccountDeletionBlocker(userId: string): Promise<AccountDeletionBlocker | null> {
  if (isFeatureEnabled('isCloud')) return null;
  const user = await UserRepository.findUserById(userId);
  if (!user || user.deletedAt || user.role !== 'admin') return null;
  return (await UserRepository.countActiveAdmins()) <= 1 ? 'last_admin' : null;
}

export async function deleteUser(userId: string): Promise<void> {
  // Outside the try below: its catch rewraps into a plain Error and would mask this message
  if ((await getAccountDeletionBlocker(userId)) === 'last_admin') {
    const t = await getTranslations('validation.account');
    throw new UserException(t('lastAdminCannotBeDeleted'));
  }

  try {
    const deletedDashboardIds = await DashboardRepository.deleteOwnedDashboards(userId);

    if (deletedDashboardIds.length > 0) {
      await InvitationRepository.cancelPendingInvitationsForDashboards(deletedDashboardIds);
    }

    await UserRepository.anonymizeUser(userId);
    console.log(`Successfully anonymized user ${userId} and deleted all associated data`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new Error('Failed to delete user account and associated data');
  }
}
