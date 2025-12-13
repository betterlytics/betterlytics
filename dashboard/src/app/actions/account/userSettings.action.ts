'use server';

import { UpdateUserData, UpdateUserSchema } from '@/entities/auth/user.entities';
import { UserSettings, UserSettingsUpdate } from '@/entities/account/userSettings.entities';
import { ChangePasswordRequest, ChangePasswordRequestSchema } from '@/entities/auth/password.entities';
import { withUserAuth } from '@/auth/auth-actions';
import * as UserSettingsService from '@/services/account/userSettings.service';
import { User } from 'next-auth';
import { setLocaleCookie } from '@/constants/cookies';

export const getUserSettingsAction = withUserAuth(async (user: User): Promise<UserSettings> => {
  return UserSettingsService.getUserSettings(user.id);
});

export const updateUserSettingsAction = withUserAuth(
  async (user: User, updates: UserSettingsUpdate): Promise<UserSettings> => {
    const result = await UserSettingsService.updateUserSettings(user.id, updates);

    if (updates.language) {
      await setLocaleCookie(updates.language);
    }

    return result;
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
