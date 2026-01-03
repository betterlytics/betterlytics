import { DashboardRole } from '@prisma/client';

export const ROLE_HIERARCHY: DashboardRole[] = ['owner', 'admin', 'member', 'viewer'];

export const ROLE_PERMISSIONS = {
  canInviteMembers: ['owner', 'admin'] as DashboardRole[],
  canCancelInvitation: ['owner', 'admin'] as DashboardRole[],
  canManageMembers: ['owner', 'admin'] as DashboardRole[],
  canChangeMemberRole: ['owner', 'admin'] as DashboardRole[],
  canRemoveMembers: ['owner', 'admin'] as DashboardRole[],
  canManageSettings: ['owner', 'admin'] as DashboardRole[],
  canDeleteDashboard: ['owner'] as DashboardRole[],
  canTransferOwnership: ['owner'] as DashboardRole[],
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS;

export function hasPermission(role: DashboardRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[permission].includes(role);
}

export function getRoleLevel(role: DashboardRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}
