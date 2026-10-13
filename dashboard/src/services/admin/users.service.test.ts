import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPasswordResetLink,
  deleteUser,
  disableUser,
  emailPasswordResetLink,
  resetTwoFactor,
} from '@/services/admin/users.service';
import * as AdminUsersRepository from '@/repositories/postgres/admin/users.repository';
import * as DashboardRepository from '@/repositories/postgres/dashboard.repository';
import * as UserRepository from '@/repositories/postgres/user.repository';
import { deleteUser as deleteUserAccount } from '@/services/account/userSettings.service';
import { issueAdminPasswordResetLink } from '@/services/auth/passwordReset.service';
import { sendTwoFactorChangedNotification } from '@/services/auth/twoFactorNotification.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';
import type { AdminActor } from '@/entities/admin/adminAccess.entities';
import type { AdminUserTarget } from '@/entities/admin/adminUser.entities';

const envMock = vi.hoisted(() => ({ DEMO_DASHBOARD_ID: 'demo-dash' as string | undefined }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ env: envMock }));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: vi.fn() }));
vi.mock('@/auth/admin-auth', () => ({ isSuperAdmin: vi.fn(() => false) }));
vi.mock('@/repositories/postgres/admin/users.repository', () => ({
  findAdminUserTarget: vi.fn(),
  findTransferCandidates: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({ findOwnedDashboards: vi.fn() }));
vi.mock('@/repositories/postgres/user.repository', () => ({
  setUserDisabledUnlessBlocked: vi.fn(),
  setUserRoleUnlessBlocked: vi.fn(),
  resetUserTwoFactor: vi.fn(),
}));
vi.mock('@/repositories/postgres/session.repository', () => ({}));
vi.mock('@/services/account/userSettings.service', () => ({ deleteUser: vi.fn() }));
vi.mock('@/services/auth/passwordReset.service', () => ({
  ADMIN_RESET_TOKEN_EXPIRY_SECONDS: 86400,
  issueAdminPasswordResetLink: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));
vi.mock('@/services/auth/twoFactorNotification.service', () => ({ sendTwoFactorChangedNotification: vi.fn() }));

const selfHost: AdminActor = {
  userId: 'admin-1',
  email: 'admin@example.com',
  edition: 'selfhost',
  twoFactorEnabled: false,
  sessionToken: 'token',
};
const cloud: AdminActor = { ...selfHost, edition: 'cloud' };

function target(overrides: Partial<AdminUserTarget> = {}): AdminUserTarget {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User',
    role: null,
    twoFactorEnabled: false,
    hasPassword: true,
    disabledAt: null,
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  envMock.DEMO_DASHBOARD_ID = 'demo-dash';
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
  vi.mocked(AdminUsersRepository.findAdminUserTarget).mockResolvedValue(target());
  vi.mocked(DashboardRepository.findOwnedDashboards).mockResolvedValue([]);
  vi.mocked(UserRepository.setUserDisabledUnlessBlocked).mockResolvedValue(null);
  vi.mocked(issueAdminPasswordResetLink).mockResolvedValue({
    token: 'raw',
    url: 'http://x/reset-password?token=raw',
    expiresAt: new Date(),
  });
});

describe('disableUser', () => {
  it('guards the last admin on self-host only', async () => {
    await disableUser(selfHost, 'user-1');
    expect(UserRepository.setUserDisabledUnlessBlocked).toHaveBeenLastCalledWith('user-1', true, { guard: true });

    await disableUser(cloud, 'user-1');
    expect(UserRepository.setUserDisabledUnlessBlocked).toHaveBeenLastCalledWith('user-1', true, { guard: false });
  });

  it('turns a last-admin refusal into a user-facing error', async () => {
    vi.mocked(UserRepository.setUserDisabledUnlessBlocked).mockResolvedValue('last_admin');

    await expect(disableUser(selfHost, 'user-1')).rejects.toBeInstanceOf(UserException);
  });

  it('refuses the acting admin themselves before touching anything', async () => {
    vi.mocked(AdminUsersRepository.findAdminUserTarget).mockResolvedValue(target({ id: 'admin-1' }));

    await expect(disableUser(selfHost, 'admin-1')).rejects.toBeInstanceOf(UserException);
    expect(UserRepository.setUserDisabledUnlessBlocked).not.toHaveBeenCalled();
  });
});

describe('password reset links', () => {
  it('issues a link for an enabled account with a password', async () => {
    expect(await createPasswordResetLink(selfHost, 'user-1')).toMatchObject({ url: expect.stringContaining('token=') });
  });

  it('refuses disabled and OAuth-only accounts', async () => {
    vi.mocked(AdminUsersRepository.findAdminUserTarget).mockResolvedValue(target({ disabledAt: new Date() }));
    await expect(createPasswordResetLink(selfHost, 'user-1')).rejects.toBeInstanceOf(UserException);

    vi.mocked(AdminUsersRepository.findAdminUserTarget).mockResolvedValue(target({ hasPassword: false }));
    await expect(createPasswordResetLink(selfHost, 'user-1')).rejects.toBeInstanceOf(UserException);

    expect(issueAdminPasswordResetLink).not.toHaveBeenCalled();
  });

  it('refuses to email a link when emails are off', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);

    await expect(emailPasswordResetLink(selfHost, 'user-1')).rejects.toBeInstanceOf(UserException);
    expect(issueAdminPasswordResetLink).not.toHaveBeenCalled();
  });
});

describe('resetTwoFactor', () => {
  it('resets and notifies a user who has 2FA', async () => {
    vi.mocked(AdminUsersRepository.findAdminUserTarget).mockResolvedValue(target({ twoFactorEnabled: true }));

    await resetTwoFactor(selfHost, 'user-1');

    expect(UserRepository.resetUserTwoFactor).toHaveBeenCalledWith('user-1');
    expect(sendTwoFactorChangedNotification).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }), false);
  });

  it('refuses a user without 2FA, so nobody is signed out or emailed for nothing', async () => {
    await expect(resetTwoFactor(selfHost, 'user-1')).rejects.toBeInstanceOf(UserException);
    expect(UserRepository.resetUserTwoFactor).not.toHaveBeenCalled();
    expect(sendTwoFactorChangedNotification).not.toHaveBeenCalled();
  });
});

describe('deleteUser', () => {
  it('transfers owned dashboards on self-host', async () => {
    await deleteUser(selfHost, 'user-1', { ownedDashboards: 'transfer', transferToUserId: 'admin-1' });

    expect(deleteUserAccount).toHaveBeenCalledWith('user-1', {
      ownedDashboards: { mode: 'transfer', toUserId: 'admin-1' },
    });
  });

  it('refuses transfers on cloud, where ownership drives billing', async () => {
    await expect(
      deleteUser(cloud, 'user-1', { ownedDashboards: 'transfer', transferToUserId: 'admin-1' }),
    ).rejects.toBeInstanceOf(UserException);
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it('refuses to delete the public demo dashboard with its owner', async () => {
    vi.mocked(DashboardRepository.findOwnedDashboards).mockResolvedValue([{ id: 'demo-dash' }] as never);

    await expect(deleteUser(selfHost, 'user-1', { ownedDashboards: 'delete' })).rejects.toBeInstanceOf(UserException);
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it('deletes owned dashboards when asked and none is the demo', async () => {
    vi.mocked(DashboardRepository.findOwnedDashboards).mockResolvedValue([{ id: 'other-dash' }] as never);

    await deleteUser(selfHost, 'user-1', { ownedDashboards: 'delete' });

    expect(deleteUserAccount).toHaveBeenCalledWith('user-1', { ownedDashboards: { mode: 'delete' } });
  });
});
