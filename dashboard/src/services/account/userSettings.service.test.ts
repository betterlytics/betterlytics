import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteUser, getAccountDeletionBlocker, getUserSettings } from '@/services/account/userSettings.service';
import * as UserRepository from '@/repositories/postgres/user.repository';
import * as UserSettingsRepository from '@/repositories/postgres/userSettings.repository';
import * as DashboardRepository from '@/repositories/postgres/dashboard.repository';
import * as InvitationRepository from '@/repositories/postgres/invitation.repository';
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
  anonymizeUser: vi.fn(),
  anonymizeUserUnlessBlocked: vi.fn(),
  findUserById: vi.fn(),
  countActiveAdmins: vi.fn(),
  countActiveUsers: vi.fn(),
}));
vi.mock('@/repositories/postgres/userSettings.repository', () => ({
  findSettingsByUserId: vi.fn(),
  createUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  deleteOwnedDashboards: vi.fn(),
}));
vi.mock('@/repositories/postgres/invitation.repository', () => ({
  cancelPendingInvitationsForDashboards: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(false);
  vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: null }));
  vi.mocked(UserRepository.countActiveAdmins).mockResolvedValue(1);
  vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(2);
  vi.mocked(UserRepository.anonymizeUserUnlessBlocked).mockResolvedValue(null);
});

describe('deleteUser last-account guard', () => {
  beforeEach(() => {
    vi.mocked(DashboardRepository.deleteOwnedDashboards).mockResolvedValue([]);
  });

  it('refuses to delete the last active admin off-cloud', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));

    const result = deleteUser('user-1');

    await expect(result).rejects.toBeInstanceOf(UserException);
    await expect(result).rejects.toThrow('lastAdminCannotBeDeleted');
    expect(DashboardRepository.deleteOwnedDashboards).not.toHaveBeenCalled();
    expect(UserRepository.anonymizeUserUnlessBlocked).not.toHaveBeenCalled();
  });

  it('refuses to delete the last active user off-cloud', async () => {
    vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(1);

    const result = deleteUser('user-1');

    await expect(result).rejects.toBeInstanceOf(UserException);
    await expect(result).rejects.toThrow('lastUserCannotBeDeleted');
    expect(DashboardRepository.deleteOwnedDashboards).not.toHaveBeenCalled();
    expect(UserRepository.anonymizeUserUnlessBlocked).not.toHaveBeenCalled();
  });

  it('deletes an admin off-cloud through the locked re-check when another active admin exists', async () => {
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(UserRepository.countActiveAdmins).mockResolvedValue(2);

    await deleteUser('user-1');

    expect(UserRepository.anonymizeUserUnlessBlocked).toHaveBeenCalledWith('user-1');
    expect(UserRepository.anonymizeUser).not.toHaveBeenCalled();
  });

  it('surfaces a blocker found by the locked re-check as a user-facing error', async () => {
    vi.mocked(UserRepository.anonymizeUserUnlessBlocked).mockResolvedValue('last_admin');

    const result = deleteUser('user-1');

    await expect(result).rejects.toBeInstanceOf(UserException);
    await expect(result).rejects.toThrow('lastAdminCannotBeDeleted');
  });

  it('deletes the last admin on Cloud without any check', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    vi.mocked(UserRepository.findUserById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(UserRepository.countActiveUsers).mockResolvedValue(1);

    await deleteUser('user-1');

    expect(UserRepository.findUserById).not.toHaveBeenCalled();
    expect(UserRepository.countActiveAdmins).not.toHaveBeenCalled();
    expect(UserRepository.anonymizeUserUnlessBlocked).not.toHaveBeenCalled();
    expect(UserRepository.anonymizeUser).toHaveBeenCalledWith('user-1');
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

describe('deleteUser', () => {
  it('anonymizes a user without owned dashboards, skipping invitation cleanup', async () => {
    vi.mocked(DashboardRepository.deleteOwnedDashboards).mockResolvedValue([]);

    await deleteUser('user-1');

    expect(InvitationRepository.cancelPendingInvitationsForDashboards).not.toHaveBeenCalled();
    expect(UserRepository.anonymizeUserUnlessBlocked).toHaveBeenCalledWith('user-1');
  });

  it('deletes owned dashboards, cancels their pending invitations, then anonymizes — in that order', async () => {
    const order: string[] = [];
    vi.mocked(DashboardRepository.deleteOwnedDashboards).mockImplementation(async () => {
      order.push('deleteDashboards');
      return ['dash-1', 'dash-2'];
    });
    vi.mocked(InvitationRepository.cancelPendingInvitationsForDashboards).mockImplementation(async () => {
      order.push('cancelInvitations');
      return 2;
    });
    vi.mocked(UserRepository.anonymizeUserUnlessBlocked).mockImplementation(async () => {
      order.push('anonymize');
      return null;
    });

    await deleteUser('user-1');

    expect(InvitationRepository.cancelPendingInvitationsForDashboards).toHaveBeenCalledWith(['dash-1', 'dash-2']);
    expect(order).toEqual(['deleteDashboards', 'cancelInvitations', 'anonymize']);
  });

  it('wraps failures in a user-safe error', async () => {
    vi.mocked(DashboardRepository.deleteOwnedDashboards).mockResolvedValue([]);
    vi.mocked(UserRepository.anonymizeUserUnlessBlocked).mockRejectedValue(new Error('db down'));

    await expect(deleteUser('user-1')).rejects.toThrow('Failed to delete user account and associated data');
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
