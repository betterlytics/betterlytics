import { z } from 'zod';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/dictionaries/dictionaries';

export const UserSettingsSchema = z
  .object({
    id: z.string(),
    userId: z.string(),

    theme: z.enum(['light', 'dark', 'system']),
    language: z.enum(SUPPORTED_LANGUAGES),

    emailNotifications: z.boolean(),
    marketingEmails: z.boolean(),

    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const UserSettingsCreateSchema = z
  .object({
    userId: z.string(),
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    emailNotifications: z.boolean(),
    marketingEmails: z.boolean(),
  })
  .strict();

export const UserSettingsUpdateSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

// Default user settings matching database defaults
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'system',
  language: DEFAULT_LANGUAGE,
  emailNotifications: true,
  marketingEmails: false,
};

export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsCreate = z.infer<typeof UserSettingsCreateSchema>;
