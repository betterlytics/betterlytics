'server-only';

import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { UpdateUserData } from '@/entities/auth/user.entities';
import {
  AccountDeletionBlocker,
  UserSettings,
  UserSettingsUpdate,
  DEFAULT_USER_SETTINGS,
  resolveAccountDeletionBlocker,
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

export async function getAccountDeletionBlocker(userId: string): Promise<AccountDeletionBlocker | null> {
  if (isFeatureEnabled('isCloud')) return null;
  const user = await UserRepository.findUserById(userId);
  if (!user) return null;
  const [activeAdmins, activeUsers] = await Promise.all([
    UserRepository.countActiveAdmins(),
    UserRepository.countActiveUsers(),
  ]);
  return resolveAccountDeletionBlocker(user, { activeAdmins, activeUsers });
}

export async function deleteUser(userId: string): Promise<void> {
  const isCloud = isFeatureEnabled('isCloud');

  // Pre-check so nothing is destroyed on refusal; the anonymize transaction re-checks under a lock
  if (!isCloud) await throwIfDeletionBlocked(await getAccountDeletionBlocker(userId));

  let blocker: AccountDeletionBlocker | null = null;
  try {
    const deletedDashboardIds = await DashboardRepository.deleteOwnedDashboards(userId);

    if (deletedDashboardIds.length > 0) {
      await InvitationRepository.cancelPendingInvitationsForDashboards(deletedDashboardIds);
    }

    if (isCloud) {
      await UserRepository.anonymizeUser(userId);
    } else {
      blocker = await UserRepository.anonymizeUserUnlessBlocked(userId);
    }
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new Error('Failed to delete user account and associated data');
  }

  // Outside the try above: its catch rewraps into a plain Error and would mask this message
  await throwIfDeletionBlocked(blocker);
  console.log(`Successfully anonymized user ${userId} and deleted all associated data`);
}

const DELETION_BLOCKER_MESSAGE_KEYS = {
  last_admin: 'lastAdminCannotBeDeleted',
  last_user: 'lastUserCannotBeDeleted',
} as const satisfies Record<AccountDeletionBlocker, string>;

async function throwIfDeletionBlocked(blocker: AccountDeletionBlocker | null): Promise<void> {
  if (!blocker) return;
  const t = await getTranslations('validation.account');
  throw new UserException(t(DELETION_BLOCKER_MESSAGE_KEYS[blocker]));
}
