'server-only';

import { DashboardRole } from '@prisma/client';
import {
  findDashboardById,
  findDashboardMembers,
  updateMemberRole as updateMemberRoleRepo,
  removeMember as removeMemberRepo,
  findUserDashboardOrNull,
  findMemberDashboardsCount,
} from '@/repositories/postgres/dashboard.repository';
import { findUserById } from '@/repositories/postgres/user.repository';
import { DashboardMember } from '@/entities/dashboard/invitation.entities';
import { getRoleLevel } from '@/lib/permissions';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';

function canModifyMember(requesterRole: DashboardRole, targetRole: DashboardRole): boolean {
  const requesterLevel = getRoleLevel(requesterRole);
  const targetLevel = getRoleLevel(targetRole);

  const canManageRoles = requesterRole === 'owner' || requesterRole === 'admin';

  return canManageRoles && requesterLevel < targetLevel;
}

function canAssignRole(requesterRole: DashboardRole, newRole: DashboardRole): boolean {
  const requesterLevel = getRoleLevel(requesterRole);
  const newRoleLevel = getRoleLevel(newRole);

  const canManageRoles = requesterRole === 'owner' || requesterRole === 'admin';

  return canManageRoles && requesterLevel <= newRoleLevel;
}

export async function getDashboardMembers(dashboardId: string): Promise<DashboardMember[]> {
  return findDashboardMembers(dashboardId);
}

export async function updateMemberRole(
  dashboardId: string,
  targetUserId: string,
  newRole: DashboardRole,
  requesterId: string,
): Promise<DashboardMember> {
  const requesterAccess = await findUserDashboardOrNull({ userId: requesterId, dashboardId });
  const targetAccess = await findUserDashboardOrNull({ userId: targetUserId, dashboardId });

  if (!requesterAccess || !targetAccess) {
    throw new Error('User not found in this dashboard');
  }

  if (targetAccess.role === 'owner') {
    throw new Error("Cannot modify owner's role");
  }

  if (newRole === 'owner') {
    throw new Error('Cannot assign owner role');
  }

  if (!canModifyMember(requesterAccess.role, targetAccess.role)) {
    throw new Error('Requester cannot modify this member role');
  }

  if (!canAssignRole(requesterAccess.role, newRole)) {
    throw new Error('Requester cannot assign this role');
  }

  return updateMemberRoleRepo(dashboardId, targetUserId, newRole);
}

export async function removeMemberFromDashboard(
  dashboardId: string,
  targetUserId: string,
  requesterId: string,
): Promise<void> {
  const requesterAccess = await findUserDashboardOrNull({ userId: requesterId, dashboardId });
  const targetAccess = await findUserDashboardOrNull({ userId: targetUserId, dashboardId });

  if (!requesterAccess || !targetAccess) {
    throw new Error('User not found in this dashboard');
  }

  if (targetAccess.role === 'owner') {
    throw new Error('Cannot remove owner from dashboard');
  }

  if (requesterAccess.role !== 'owner' && requesterAccess.role !== 'admin') {
    throw new Error('Requester does not have permission to remove members');
  }

  if (requesterAccess.role === 'admin' && targetAccess.role === 'admin') {
    throw new Error('Admins cannot remove other admins');
  }

  await removeMemberRepo(dashboardId, targetUserId);
  await sendMemberRemovedNotification(dashboardId, targetUserId);
}

async function sendMemberRemovedNotification(dashboardId: string, removedUserId: string): Promise<void> {
  try {
    const [removedUser, dashboard] = await Promise.all([
      findUserById(removedUserId),
      findDashboardById(dashboardId),
    ]);

    if (!removedUser?.email || !dashboard) return;

    await enqueueEmail({
      type: 'member-removed',
      recipientKey: createUserRecipientKey(removedUserId),
      campaignKey: `member-removed:${dashboardId}:${new Date().toISOString()}`,
      data: {
        to: removedUser.email,
        userName: removedUser.name,
        dashboardDomain: dashboard.domain,
      },
    });
  } catch (err) {
    console.error('Failed to enqueue member-removed notification:', { dashboardId, removedUserId, err });
  }
}

export async function leaveDashboard(dashboardId: string, userId: string): Promise<void> {
  const userAccess = await findUserDashboardOrNull({ userId, dashboardId });

  if (!userAccess) {
    throw new Error('User not found in this dashboard');
  }

  if (userAccess.role === 'owner') {
    throw new Error('Cannot leave dashboard as owner');
  }

  await removeMemberRepo(dashboardId, userId);
}

export async function isUserDashboardMember(userId: string): Promise<boolean> {
  const userAccessCount = await findMemberDashboardsCount(userId);

  return userAccessCount > 0;
}
