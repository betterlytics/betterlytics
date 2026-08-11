/**
 * Characterization tests for password change and account deletion (internal
 * issue #50).
 *
 * Pins behavior the better-auth migration must preserve: changing a password
 * requires the current password and revokes every OTHER session (keeping the
 * active one), and account deletion anonymizes the user after tearing down
 * owned dashboards and pending invitations.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeUserPassword, deleteUser, getUserSettings } from '@/services/account/userSettings.service';
import * as UserRepository from '@/repositories/postgres/user.repository';
import * as UserSettingsRepository from '@/repositories/postgres/userSettings.repository';
import * as SessionRepository from '@/repositories/postgres/session.repository';
import * as DashboardRepository from '@/repositories/postgres/dashboard.repository';
import * as InvitationRepository from '@/repositories/postgres/invitation.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { DEFAULT_USER_SETTINGS } from '@/entities/account/userSettings.entities';
import { makeUser } from '@/test/auth-fixtures';

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_DEFAULT_LANGUAGE: 'en',
  },
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  updateUserPassword: vi.fn(),
  verifyUserPassword: vi.fn(),
  anonymizeUser: vi.fn(),
}));
vi.mock('@/repositories/postgres/userSettings.repository', () => ({
  findSettingsByUserId: vi.fn(),
  createUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}));
vi.mock('@/repositories/postgres/session.repository', () => ({
  deleteAllUserSessions: vi.fn(),
  deleteOtherUserSessions: vi.fn(),
  countUserSessions: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  deleteOwnedDashboards: vi.fn(),
}));
vi.mock('@/repositories/postgres/invitation.repository', () => ({
  cancelPendingInvitationsForDashboards: vi.fn(),
}));
vi.mock('@/repositories/postgres/passwordReset.repository', () => ({
  createPasswordResetToken: vi.fn(),
  findPasswordResetToken: vi.fn(),
  deletePasswordResetToken: vi.fn(),
  deleteUserPasswordResetTokens: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

const SESSION_TOKEN = 'current-session-token';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('changeUserPassword', () => {
  it('rejects when there is no active session token', async () => {
    await expect(changeUserPassword('user-1', 'Old-password-1', 'New-password-1', undefined)).rejects.toMatchObject({
      name: 'UserException',
      message: 'No active session token found',
    });
    expect(UserRepository.verifyUserPassword).not.toHaveBeenCalled();
    expect(UserRepository.updateUserPassword).not.toHaveBeenCalled();
  });

  it('rejects when the current password is wrong, without updating anything', async () => {
    vi.mocked(UserRepository.verifyUserPassword).mockResolvedValue(false);

    await expect(
      changeUserPassword('user-1', 'Wrong-password-1', 'New-password-1', SESSION_TOKEN),
    ).rejects.toMatchObject({
      name: 'UserException',
      message: 'Current password is incorrect',
    });
    expect(UserRepository.updateUserPassword).not.toHaveBeenCalled();
    expect(SessionRepository.deleteOtherUserSessions).not.toHaveBeenCalled();
  });

  it('rejects OAuth-only accounts (no local password): password management belongs to the provider', async () => {
    // verifyUserPassword returns false when passwordHash is null, so an OAuth-only
    // account can never set a local password through the change-password flow.
    vi.mocked(UserRepository.verifyUserPassword).mockResolvedValue(false);

    await expect(
      changeUserPassword('oauth-user', 'Anything-at-all-1', 'New-password-1', SESSION_TOKEN),
    ).rejects.toMatchObject({ name: 'UserException', message: 'Current password is incorrect' });
    expect(UserRepository.updateUserPassword).not.toHaveBeenCalled();
  });

  it('updates the password and revokes every session except the current one', async () => {
    const user = makeUser();
    vi.mocked(UserRepository.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(UserRepository.findUserById).mockResolvedValue(user);
    vi.mocked(SessionRepository.deleteOtherUserSessions).mockResolvedValue(2);

    await changeUserPassword(user.id, 'Old-password-1', 'New-password-1', SESSION_TOKEN);

    expect(UserRepository.verifyUserPassword).toHaveBeenCalledWith(user.id, 'Old-password-1');
    expect(UserRepository.updateUserPassword).toHaveBeenCalledWith(user.id, 'New-password-1');
    expect(SessionRepository.deleteOtherUserSessions).toHaveBeenCalledWith(user.id, SESSION_TOKEN);
    expect(SessionRepository.deleteAllUserSessions).not.toHaveBeenCalled();
  });

  it('sends a password-changed notification email on success', async () => {
    const user = makeUser();
    vi.mocked(UserRepository.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(UserRepository.findUserById).mockResolvedValue(user);

    await changeUserPassword(user.id, 'Old-password-1', 'New-password-1', SESSION_TOKEN);

    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-changed',
        data: expect.objectContaining({ to: user.email }),
      }),
    );
  });

  it('still succeeds when the notification email fails to enqueue', async () => {
    const user = makeUser();
    vi.mocked(UserRepository.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(UserRepository.findUserById).mockResolvedValue(user);
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('mailer down'));

    await expect(
      changeUserPassword(user.id, 'Old-password-1', 'New-password-1', SESSION_TOKEN),
    ).resolves.toBeUndefined();
  });

  it('wraps repository failures in a user-safe error', async () => {
    vi.mocked(UserRepository.verifyUserPassword).mockResolvedValue(true);
    vi.mocked(UserRepository.updateUserPassword).mockRejectedValue(new Error('db down'));

    await expect(
      changeUserPassword('user-1', 'Old-password-1', 'New-password-1', SESSION_TOKEN),
    ).rejects.toMatchObject({
      name: 'UserException',
      message: 'Failed to change password',
    });
    expect(SessionRepository.deleteOtherUserSessions).not.toHaveBeenCalled();
  });
});

describe('deleteUser', () => {
  it('anonymizes a user without owned dashboards, skipping invitation cleanup', async () => {
    vi.mocked(DashboardRepository.deleteOwnedDashboards).mockResolvedValue([]);

    await deleteUser('user-1');

    expect(InvitationRepository.cancelPendingInvitationsForDashboards).not.toHaveBeenCalled();
    expect(UserRepository.anonymizeUser).toHaveBeenCalledWith('user-1');
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
    vi.mocked(UserRepository.anonymizeUser).mockImplementation(async () => {
      order.push('anonymize');
    });

    await deleteUser('user-1');

    expect(InvitationRepository.cancelPendingInvitationsForDashboards).toHaveBeenCalledWith(['dash-1', 'dash-2']);
    expect(order).toEqual(['deleteDashboards', 'cancelInvitations', 'anonymize']);
  });

  it('wraps failures in a user-safe error', async () => {
    vi.mocked(DashboardRepository.deleteOwnedDashboards).mockResolvedValue([]);
    vi.mocked(UserRepository.anonymizeUser).mockRejectedValue(new Error('db down'));

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
