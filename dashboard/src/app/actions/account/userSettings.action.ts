'use server';

import { UpdateUserData, UpdateUserSchema } from '@/entities/auth/user.entities';
import { UserSettings, UserSettingsUpdateSchema } from '@/entities/account/userSettings.entities';
import { ChangePasswordRequest, ChangePasswordRequestSchema } from '@/entities/auth/password.entities';
import { withUserAuth } from '@/auth/auth-actions';
import * as UserSettingsService from '@/services/account/userSettings.service';
import {
  countUserSessions,
  getCurrentSessionTokenFromCookies,
  invalidateOtherUserSessions,
} from '@/services/session.service';
import { UserException } from '@/lib/exceptions';
import { User } from 'next-auth';
import { setLocaleCookie } from '@/constants/cookies';
import { Theme, AvatarMode } from '@prisma/client';
import type { SupportedLanguages } from '@/constants/i18n';

export const getUserSettingsAction = withUserAuth(async (user: User): Promise<UserSettings> => {
  return UserSettingsService.getUserSettings(user.id);
});

export const updateUserThemeAction = withUserAuth(
  async (user: User, input: { theme: Theme }): Promise<UserSettings> => {
    const payload = UserSettingsUpdateSchema.required().pick({ theme: true }).parse(input);
    return UserSettingsService.updateUserSettings(user.id, payload);
  },
);

export const updateUserLanguageAction = withUserAuth(
  async (user: User, input: { language: SupportedLanguages }): Promise<UserSettings> => {
    const payload = UserSettingsUpdateSchema.required().pick({ language: true }).parse(input);
    const result = await UserSettingsService.updateUserSettings(user.id, payload);
    await setLocaleCookie(payload.language);
    return result;
  },
);

export const updateUserAvatarAction = withUserAuth(
  async (user: User, input: { avatar: AvatarMode }): Promise<UserSettings> => {
    const payload = UserSettingsUpdateSchema.required().pick({ avatar: true }).parse(input);
    return UserSettingsService.updateUserSettings(user.id, payload);
  },
);

export const updateUserEmailNotificationsAction = withUserAuth(
  async (user: User, input: { emailNotifications: boolean }): Promise<UserSettings> => {
    const payload = UserSettingsUpdateSchema.required().pick({ emailNotifications: true }).parse(input);
    return UserSettingsService.updateUserSettings(user.id, payload);
  },
);

export const updateUserMarketingEmailsAction = withUserAuth(
  async (user: User, input: { marketingEmails: boolean }): Promise<UserSettings> => {
    const payload = UserSettingsUpdateSchema.required().pick({ marketingEmails: true }).parse(input);
    return UserSettingsService.updateUserSettings(user.id, payload);
  },
);

export const deleteUserAccountAction = withUserAuth(async (user: User): Promise<void> => {
  return await UserSettingsService.deleteUser(user.id);
});

export const updateUserAction = withUserAuth(async (user: User, data: UpdateUserData): Promise<void> => {
  const validatedData = UpdateUserSchema.parse(data);

  return await UserSettingsService.updateUser(user.id, validatedData);
});

export const getActiveSessionCountAction = withUserAuth(async (user: User): Promise<number> => {
  return countUserSessions(user.id);
});

export const signOutOtherSessionsAction = withUserAuth(async (user: User): Promise<{ revoked: number }> => {
  const currentSessionToken = await getCurrentSessionTokenFromCookies();
  if (!currentSessionToken) {
    throw new UserException('No active session token found');
  }
  const revoked = await invalidateOtherUserSessions(user.id, currentSessionToken);
  return { revoked };
});

export const changePasswordAction = withUserAuth(
  async (user: User, data: ChangePasswordRequest): Promise<void> => {
    const validatedData = ChangePasswordRequestSchema.parse(data);
    const currentSessionToken = await getCurrentSessionTokenFromCookies();

    return await UserSettingsService.changeUserPassword(
      user.id,
      validatedData.currentPassword,
      validatedData.newPassword,
      currentSessionToken,
    );
  },
);
