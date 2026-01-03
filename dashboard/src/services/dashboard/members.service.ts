'use server';

import { DashboardRole } from '@prisma/client';
import {
  findDashboardMembers,
  updateMemberRole as updateMemberRoleRepo,
  removeMember as removeMemberRepo,
  findUserDashboardOrNull,
} from '@/repositories/postgres/dashboard.repository';
import { DashboardMember } from '@/entities/dashboard/invitation.entities';
import { getRoleLevel } from '@/lib/permissions';

function canModifyRole(requesterRole: DashboardRole, targetRole: DashboardRole): boolean {
  const requesterLevel = getRoleLevel(requesterRole);
  const targetLevel = getRoleLevel(targetRole);

  const canManageRoles = requesterRole === 'owner' || requesterRole === 'admin';

  return canManageRoles && requesterLevel <= targetLevel;
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

  if (!canModifyRole(requesterAccess.role, targetAccess.role)) {
    throw new Error('Requester cannot modify this member role');
  }

  if (!canModifyRole(requesterAccess.role, newRole)) {
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
}
