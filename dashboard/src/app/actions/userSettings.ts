'use server';

import { UpdateUserData, UpdateUserSchema } from '@/entities/user';
import { UserSettings, UserSettingsUpdate } from '@/entities/userSettings';
import { ChangePasswordRequest, ChangePasswordRequestSchema } from '@/entities/password';
import { withUserAuth } from '@/auth/auth-actions';
import * as UserSettingsService from '@/services/userSettings';
import { User } from 'next-auth';
import { getCurrentSessionToken } from '@/repositories/postgres/session';

export const getUserSettingsAction = withUserAuth(async (user: User): Promise<UserSettings> => {
  return UserSettingsService.getUserSettings(user.id);
});

export const updateUserSettingsAction = withUserAuth(
  async (user: User, updates: UserSettingsUpdate): Promise<UserSettings> => {
    return UserSettingsService.updateUserSettings(user.id, updates);
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
    const currentSessionToken = await getCurrentSessionToken();

    return await UserSettingsService.changeUserPassword(
      user.id,
      validatedData.currentPassword,
      validatedData.newPassword,
      currentSessionToken,
    );
  },
);
