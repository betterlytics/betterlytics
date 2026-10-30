import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteUser, getAccountDeletionBlocker, getUserSettings } from '@/services/account/userSettings.service';
import * as UserRepository from '@/repositories/postgres/user.repository';
import * as UserSettingsRepository from '@/repositories/postgres/userSettings.repository';
import { DEFAULT_USER_SETTINGS } from '@/entities/account/userSettings.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';
import { makeUser } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_DEFAULT_LANGUAGE: 'en',
  },
}));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: vi.fn() }));
vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/repositories/postgres/user.repository', () => ({
  updateUser: vi.fn(),
  deleteUserAccount: vi.fn(),
  findUserById: vi.fn(),
  countActiveAdmins: vi.fn(),
  countActiveUsers: vi.fn(),
}));
vi.mock('@/repositories/postgres/userSettings.repository', () => ({
  findSettingsByUserId: vi.fn(),
  createUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(false);
  vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: null }));
  vi.mocked(UserRepository.countActiveAdmins).mockResolvedValue(1);
  vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(2);
  vi.mocked(UserRepository.deleteUserAccount).mockResolvedValue(null);
});

describe('deleteUser', () => {
  it('deletes owned dashboards by default, guarded by the locked last-account check off-cloud', async () => {
    await deleteUser('user-1');

    expect(UserRepository.deleteUserAccount).toHaveBeenCalledWith('user-1', {
      guard: true,
      ownedDashboards: { mode: 'delete' },
      removedById: 'user-1',
    });
  });

  it('passes a dashboard transfer through to the locked deletion', async () => {
    await deleteUser('user-1', { ownedDashboards: { mode: 'transfer', toUserId: 'user-2' } });

    expect(UserRepository.deleteUserAccount).toHaveBeenCalledWith('user-1', {
      guard: true,
      ownedDashboards: { mode: 'transfer', toUserId: 'user-2' },
      removedById: 'user-1',
    });
  });

  it('skips the last-account guard on Cloud', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);

    await deleteUser('user-1');

    expect(UserRepository.deleteUserAccount).toHaveBeenCalledWith('user-1', {
      guard: false,
      ownedDashboards: { mode: 'delete' },
      removedById: 'user-1',
    });
  });

  it('records whoever ran the deletion as the remover of the memberships', async () => {
    await deleteUser('user-1', { ownedDashboards: { mode: 'delete' }, removedById: 'admin-1' });

    expect(UserRepository.deleteUserAccount).toHaveBeenCalledWith('user-1', {
      guard: true,
      ownedDashboards: { mode: 'delete' },
      removedById: 'admin-1',
    });
  });

  it('surfaces the last admin refusal as a user-facing error', async () => {
    vi.mocked(UserRepository.deleteUserAccount).mockResolvedValue('last_admin');

    const result = deleteUser('user-1');

    await expect(result).rejects.toBeInstanceOf(UserException);
    await expect(result).rejects.toThrow('lastAdminCannotBeDeleted');
  });

  it('surfaces the last user refusal as a user-facing error', async () => {
    vi.mocked(UserRepository.deleteUserAccount).mockResolvedValue('last_user');

    await expect(deleteUser('user-1')).rejects.toThrow('lastUserCannotBeDeleted');
  });

  it('surfaces a recipient that can no longer take the dashboards', async () => {
    vi.mocked(UserRepository.deleteUserAccount).mockResolvedValue('invalid_recipient');

    const result = deleteUser('user-1', { ownedDashboards: { mode: 'transfer', toUserId: 'user-2' } });

    await expect(result).rejects.toBeInstanceOf(UserException);
  });

  it('wraps failures in a user-safe error', async () => {
    vi.mocked(UserRepository.deleteUserAccount).mockRejectedValue(new Error('db down'));

    await expect(deleteUser('user-1')).rejects.toThrow('Failed to delete user account and associated data');
  });
});

describe('getAccountDeletionBlocker', () => {
  it('blocks the last active admin off-cloud', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));

    expect(await getAccountDeletionBlocker('user-1')).toBe('last_admin');
  });

  it('blocks an admin as last_admin even when they are also the last user', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(1);

    expect(await getAccountDeletionBlocker('user-1')).toBe('last_admin');
  });

  it('does not block an admin when another active admin exists', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(UserRepository.countActiveAdmins).mockResolvedValue(2);

    expect(await getAccountDeletionBlocker('user-1')).toBeNull();
  });

  it('blocks the last active user off-cloud, even when no admin is left', async () => {
    vi.mocked(UserRepository.countActiveAdmins).mockResolvedValue(0);
    vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(1);

    expect(await getAccountDeletionBlocker('user-1')).toBe('last_user');
  });

  it('does not block a non-admin while other users exist', async () => {
    expect(await getAccountDeletionBlocker('user-1')).toBeNull();
  });

  it('does not block a disabled admin, who no longer counts as one', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin', disabledAt: new Date() }));

    expect(await getAccountDeletionBlocker('user-1')).toBeNull();
  });

  it('does not block an already deleted user', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin', deletedAt: new Date() }));
    vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(1);

    expect(await getAccountDeletionBlocker('user-1')).toBeNull();
  });

  it('never blocks on Cloud', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(1);

    expect(await getAccountDeletionBlocker('user-1')).toBeNull();
    expect(UserRepository.findUserById).not.toHaveBeenCalled();
  });
});

describe('getUserSettings', () => {
  it('returns stored settings when they exist', async () => {
    const settings = { ...DEFAULT_USER_SETTINGS, userId: 'user-1' };
    vi.mocked(UserSettingsRepository.findSettingsByUserId).mockResolvedValue(settings as never);

    expect(await getUserSettings('user-1')).toEqual(settings);
    expect(UserSettingsRepository.createUserSettings).not.toHaveBeenCalled();
  });

  it('lazily provisions default settings for users without any', async () => {
    vi.mocked(UserSettingsRepository.findSettingsByUserId).mockResolvedValue(null);
    vi.mocked(UserSettingsRepository.createUserSettings).mockResolvedValue({
      ...DEFAULT_USER_SETTINGS,
      userId: 'user-1',
    } as never);

    const result = await getUserSettings('user-1');

    expect(UserSettingsRepository.createUserSettings).toHaveBeenCalledWith('user-1', DEFAULT_USER_SETTINGS);
    expect(result).toMatchObject(DEFAULT_USER_SETTINGS);
  });
});
