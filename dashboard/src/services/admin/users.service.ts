import 'server-only';

import { isSuperAdmin } from '@/auth/admin-auth';
import { getCachedSession } from '@/auth/api-auth';
import {
  resolveAdminTargetBlocker,
  resolveAdminTargetBlockers,
  type AdminActor,
  type AdminTargetAction,
  type AdminTargetBlocker,
} from '@/entities/admin/adminAccess.entities';
import {
  resolveAdminUserStatus,
  type AdminDeleteUserContext,
  type AdminDeleteUserInput,
  type AdminUserListQuery,
  type AdminUserListResult,
  type AdminUserTarget,
  type AdminUserView,
} from '@/entities/admin/adminUser.entities';
import type { AccountDeletionBlocker } from '@/entities/account/userSettings.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/admin';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';
import * as AdminUsersRepository from '@/repositories/postgres/admin/users.repository';
import * as UserRepository from '@/repositories/postgres/user.repository';
import * as SessionRepository from '@/repositories/postgres/session.repository';
import { deleteUser as deleteUserAccount } from '@/services/account/userSettings.service';
import {
  ADMIN_RESET_TOKEN_EXPIRY_SECONDS,
  issueAdminPasswordResetLink,
  sendResetPasswordEmail,
} from '@/services/auth/passwordReset.service';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';

const TARGET_BLOCKER_MESSAGES: Record<AdminTargetBlocker, string> = {
  self: "You can't do this to your own account",
  super_admin: "Super admins can't change other super admins",
  deleted: 'This user has been deleted',
  not_available: "This isn't available on this instance",
};

const ACCESS_REMOVAL_BLOCKER_MESSAGES: Record<AccountDeletionBlocker, string> = {
  last_admin: 'This is the last admin. Make another user an admin first.',
  last_user: 'This is the last active user on this instance.',
};

function blockersFor(actor: AdminActor, target: { id: string; deletedAt: Date | null }) {
  return resolveAdminTargetBlockers({
    edition: actor.edition,
    actorUserId: actor.userId,
    target: { ...target, isSuperAdmin: isSuperAdmin(target.id) },
  });
}

async function requireTarget(actor: AdminActor, userId: string, action: AdminTargetAction): Promise<AdminUserTarget> {
  const target = await AdminUsersRepository.findAdminUserTarget(userId);
  if (!target) throw new UserException('User not found');

  const blocker = resolveAdminTargetBlocker({
    action,
    edition: actor.edition,
    actorUserId: actor.userId,
    target: { id: target.id, deletedAt: target.deletedAt, isSuperAdmin: isSuperAdmin(target.id) },
  });
  if (blocker) throw new UserException(TARGET_BLOCKER_MESSAGES[blocker]);

  return target;
}

function throwIfAccessRemovalBlocked(blocker: AccountDeletionBlocker | null): void {
  if (blocker) throw new UserException(ACCESS_REMOVAL_BLOCKER_MESSAGES[blocker]);
}

export async function getTargetLabel(userId: string): Promise<string | null> {
  const target = await AdminUsersRepository.findAdminUserTarget(userId);
  return target?.email ?? null;
}

export async function listUsers(actor: AdminActor, query: AdminUserListQuery): Promise<AdminUserListResult> {
  const [{ users, total }, statusCounts] = await Promise.all([
    AdminUsersRepository.listAdminUsers(query),
    AdminUsersRepository.countAdminUsersByStatus(query.search),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      status: resolveAdminUserStatus(user),
      isSelf: user.id === actor.userId,
      isSuperAdmin: isSuperAdmin(user.id),
      actions: blockersFor(actor, user),
    })),
    total,
    page: query.page,
    pageSize: ADMIN_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    statusCounts,
  };
}

export async function getUser(actor: AdminActor, userId: string): Promise<AdminUserView | null> {
  const detail = await AdminUsersRepository.findAdminUserDetail(userId);
  if (!detail) return null;

  const [sessions, currentSessionId] = await Promise.all([
    detail.deletedAt ? Promise.resolve([]) : SessionRepository.findActiveUserSessions(userId),
    currentActorSessionId(actor, userId),
  ]);

  return {
    ...detail,
    status: resolveAdminUserStatus(detail),
    isSelf: detail.id === actor.userId,
    isSuperAdmin: isSuperAdmin(detail.id),
    actions: blockersFor(actor, detail),
    sessions: sessions.map((session) => ({ ...session, isCurrent: session.id === currentSessionId })),
  };
}

async function currentActorSessionId(actor: AdminActor, userId: string): Promise<string | null> {
  if (actor.userId !== userId) return null;
  const token = (await getCachedSession())?.session.token;
  return token ? SessionRepository.findSessionIdByToken(token) : null;
}

export async function disableUser(actor: AdminActor, userId: string): Promise<void> {
  await requireTarget(actor, userId, 'disable');
  throwIfAccessRemovalBlocked(await UserRepository.setUserDisabledUnlessBlocked(userId, true));
}

export async function enableUser(actor: AdminActor, userId: string): Promise<void> {
  await requireTarget(actor, userId, 'enable');
  await UserRepository.setUserDisabledUnlessBlocked(userId, false);
}

export async function setInstanceAdmin(actor: AdminActor, userId: string, isAdmin: boolean): Promise<void> {
  await requireTarget(actor, userId, 'change_role');
  throwIfAccessRemovalBlocked(await UserRepository.setUserRoleUnlessBlocked(userId, isAdmin ? 'admin' : null));
}

export async function revokeUserSession(actor: AdminActor, userId: string, sessionId: string): Promise<void> {
  await requireTarget(actor, userId, 'revoke_sessions');
  const currentSessionId = await currentActorSessionId(actor, userId);
  if (sessionId === currentSessionId) {
    throw new UserException("You can't sign out the session you're using right now");
  }
  await SessionRepository.deleteUserSession(userId, sessionId);
}

export async function revokeAllUserSessions(actor: AdminActor, userId: string): Promise<{ revoked: number }> {
  await requireTarget(actor, userId, 'revoke_sessions');
  if (actor.userId === userId) {
    const token = (await getCachedSession())?.session.token;
    if (!token) throw new UserException('No active session token found');
    return { revoked: await SessionRepository.deleteOtherUserSessions(userId, token) };
  }
  return { revoked: await SessionRepository.deleteAllUserSessions(userId) };
}

async function requirePasswordResetTarget(actor: AdminActor, userId: string): Promise<AdminUserTarget> {
  const target = await requireTarget(actor, userId, 'reset_password');
  if (target.disabledAt) throw new UserException('Enable this user before resetting their password');
  if (!target.hasPassword) throw new UserException('This user signs in with Google or GitHub and has no password');
  return target;
}

export async function createPasswordResetLink(
  actor: AdminActor,
  userId: string,
): Promise<{ url: string; expiresAt: Date }> {
  await requirePasswordResetTarget(actor, userId);
  const { url, expiresAt } = await issueAdminPasswordResetLink(userId);
  return { url, expiresAt };
}

export async function emailPasswordResetLink(actor: AdminActor, userId: string): Promise<void> {
  if (!isFeatureEnabled('enableEmails')) throw new UserException('Email is not configured on this instance');
  const target = await requirePasswordResetTarget(actor, userId);
  const { token, url } = await issueAdminPasswordResetLink(userId);
  await sendResetPasswordEmail(
    { id: target.id, email: target.email, name: target.name },
    url,
    token,
    ADMIN_RESET_TOKEN_EXPIRY_SECONDS,
  );
}

export async function resetTwoFactor(actor: AdminActor, userId: string): Promise<void> {
  const target = await requireTarget(actor, userId, 'reset_two_factor');
  await UserRepository.resetUserTwoFactor(userId);

  try {
    await enqueueEmail({
      type: 'two-factor-disabled',
      recipientKey: createUserRecipientKey(target.id),
      campaignKey: `two-factor-disabled:${new Date().toISOString()}`,
      data: { to: target.email, userName: target.name },
    });
  } catch (error) {
    console.error('Failed to enqueue 2FA reset notification:', error);
  }
}

export async function getDeleteUserContext(actor: AdminActor, userId: string): Promise<AdminDeleteUserContext> {
  await requireTarget(actor, userId, 'delete');
  const canTransfer = actor.edition === 'selfhost';
  const [ownedDashboards, transferCandidates] = await Promise.all([
    AdminUsersRepository.findOwnedLiveDashboards(userId),
    canTransfer ? AdminUsersRepository.findTransferCandidates(userId) : Promise.resolve([]),
  ]);
  return {
    ownedDashboards: ownedDashboards.map(({ dashboardId, domain }) => ({ dashboardId, domain })),
    transferCandidates,
    canTransfer,
  };
}

export async function deleteUser(actor: AdminActor, userId: string, input: AdminDeleteUserInput): Promise<void> {
  await requireTarget(actor, userId, 'delete');

  if (input.ownedDashboards === 'transfer') {
    if (actor.edition !== 'selfhost') {
      throw new UserException("Dashboards can't be transferred on this instance");
    }
    await deleteUserAccount(userId, {
      ownedDashboards: { mode: 'transfer', toUserId: input.transferToUserId },
    });
    return;
  }

  if (env.DEMO_DASHBOARD_ID) {
    const owned = await AdminUsersRepository.findOwnedLiveDashboards(userId);
    if (owned.some((dashboard) => dashboard.dashboardId === env.DEMO_DASHBOARD_ID)) {
      throw new UserException('This user owns the public demo dashboard and cannot be deleted');
    }
  }

  await deleteUserAccount(userId, { ownedDashboards: { mode: 'delete' } });
}
