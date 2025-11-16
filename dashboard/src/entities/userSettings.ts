import { z } from 'zod';
import { Theme, AvatarMode } from '@prisma/client';

import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import { env } from '@/lib/env';

export const UserSettingsSchema = z
  .object({
    id: z.string(),
    userId: z.string(),

    theme: z.nativeEnum(Theme),
    language: z.enum(SUPPORTED_LANGUAGES),
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
    emailNotifications: z.boolean(),
    marketingEmails: z.boolean(),
  })
  .strict();

export const UserSettingsUpdateSchema = z.object({
  theme: z.nativeEnum(Theme).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  avatar: z.nativeEnum(AvatarMode).optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

// Default user settings matching database defaults
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: Theme.system,
  language: env.NEXT_PUBLIC_DEFAULT_LANGUAGE,
  avatar: AvatarMode.default,
  emailNotifications: true,
  marketingEmails: false,
};

export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsCreate = z.infer<typeof UserSettingsCreateSchema>;
