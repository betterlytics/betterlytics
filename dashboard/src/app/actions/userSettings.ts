'use server';

import { UpdateUserData, UpdateUserSchema } from '@/entities/user';
import { UserSettings, UserSettingsUpdate } from '@/entities/userSettings';
import { ChangePasswordRequest, ChangePasswordRequestSchema } from '@/entities/password';
import { withUserAuth } from '@/auth/auth-actions';
import * as UserSettingsService from '@/services/userSettings';
import { User } from 'next-auth';

const CACHE_TTL_MS = 60 * 30 * 1000;

const isOutOfSync = (user: User): boolean => {
  if (!user.settings?.synchronizedAt) return true;
  return user.settings.synchronizedAt.getTime() < Date.now() - CACHE_TTL_MS;
};

export const getUserSettingsAction = withUserAuth(async (user: User): Promise<UserSettings> => {
  if (isOutOfSync(user)) {
    user.settings = {
      ...(await UserSettingsService.getUserSettings(user.id)),
      synchronizedAt: new Date(),
    };
  }
  return user.settings!;
});

export const updateUserSettingsAction = withUserAuth(
  async (user: User, updates: UserSettingsUpdate): Promise<UserSettings> => {
    user.settings = {
      ...(await UserSettingsService.updateUserSettings(user.id, updates)),
      synchronizedAt: new Date(),
    };
    return user.settings;
  },
);

export const deleteUserAccountAction = withUserAuth(async (user: User): Promise<void> => {
  return await UserSettingsService.deleteUser(user.id);
});

export const updateUserAction = withUserAuth(async (user: User, data: UpdateUserData): Promise<void> => {
  const validatedData = UpdateUserSchema.parse(data);

  return await UserSettingsService.updateUser(user.id, validatedData);
});

export const changePasswordAction = withUserAuth(
  async (user: User, data: ChangePasswordRequest): Promise<void> => {
    const validatedData = ChangePasswordRequestSchema.parse(data);

    return await UserSettingsService.changeUserPassword(
      user.id,
      validatedData.currentPassword,
      validatedData.newPassword,
    );
  },
);
