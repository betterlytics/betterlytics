import { z } from 'zod';
import { Theme, AvatarMode } from '@prisma/client';

import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import { env } from '@/lib/env';
import { isValidTimezone } from '@/utils/timezone';

// null means auto-detect from the browser
const TimezoneSettingSchema = z.string().refine(isValidTimezone).nullable();

export const UserSettingsSchema = z
  .object({
    id: z.string(),
    userId: z.string(),

    theme: z.nativeEnum(Theme),
    language: z.enum(SUPPORTED_LANGUAGES),
    timezone: TimezoneSettingSchema,
    avatar: z.nativeEnum(AvatarMode),

    emailNotifications: z.boolean(),
    marketingEmails: z.boolean(),

    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const UserSettingsCreateSchema = z
  .object({
    userId: z.string(),
    theme: z.nativeEnum(Theme),
    avatar: z.nativeEnum(AvatarMode),
    language: z.enum(SUPPORTED_LANGUAGES).default('en'),
    timezone: TimezoneSettingSchema.default(null),
    emailNotifications: z.boolean(),
    marketingEmails: z.boolean(),
  })
  .strict();

export const UserSettingsUpdateSchema = UserSettingsSchema
  .pick({
    theme: true,
    language: true,
    timezone: true,
    avatar: true,
    emailNotifications: true,
    marketingEmails: true,
  })
  .partial();

// Default user settings matching database defaults
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: Theme.system,
  language: env.NEXT_PUBLIC_DEFAULT_LANGUAGE,
  timezone: null,
  avatar: AvatarMode.default,
  emailNotifications: true,
  marketingEmails: false,
};

export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsCreate = z.infer<typeof UserSettingsCreateSchema>;
