import { describe, it, expect, vi } from 'vitest';
import { Theme, AvatarMode } from '@prisma/client';
import { UserSettingsSchema, UserSettingsUpdateSchema } from '@/entities/account/userSettings.entities';

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_DEFAULT_LANGUAGE: 'en',
  },
}));

const storedRow = {
  id: 'settings-1',
  userId: 'user-1',
  theme: Theme.system,
  language: 'en',
  timezone: 'Europe/Berlin',
  avatar: AvatarMode.default,
  emailNotifications: true,
  marketingEmails: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserSettingsSchema timezone', () => {
  it('keeps a valid stored zone', () => {
    expect(UserSettingsSchema.parse(storedRow).timezone).toBe('Europe/Berlin');
  });

  it('reads a stored zone this server rejects as Auto-detect', () => {
    expect(UserSettingsSchema.parse({ ...storedRow, timezone: 'Foo/Bar' }).timezone).toBeNull();
  });
});

describe('UserSettingsUpdateSchema timezone', () => {
  it('rejects a zone this server rejects', () => {
    expect(UserSettingsUpdateSchema.safeParse({ timezone: 'Foo/Bar' }).success).toBe(false);
  });

  it('accepts a valid zone and Auto-detect', () => {
    expect(UserSettingsUpdateSchema.parse({ timezone: 'Europe/Berlin' }).timezone).toBe('Europe/Berlin');
    expect(UserSettingsUpdateSchema.parse({ timezone: null }).timezone).toBeNull();
  });
});
