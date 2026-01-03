import { DashboardRole } from '@prisma/client';

export const ROLE_HIERARCHY: readonly DashboardRole[] = ['owner', 'admin', 'member', 'viewer'];

export const ROLE_PERMISSIONS = {
  canInviteMembers: ['owner', 'admin'],
  canCancelInvitation: ['owner', 'admin'],
  canChangeMemberRole: ['owner', 'admin'],
  canRemoveMembers: ['owner', 'admin'],
  canDeleteDashboard: ['owner'],
  canSubmitBugReports: ['owner', 'admin', 'member', 'viewer'],
  canManageSettings: ['owner', 'admin'],
} satisfies Record<string, readonly DashboardRole[]>;

export type Permission = keyof typeof ROLE_PERMISSIONS;

function getRolesForPermission(permission: Permission): readonly DashboardRole[] {
  return ROLE_PERMISSIONS[permission];
}

export function hasPermission(role: DashboardRole, permission: Permission): boolean {
  return getRolesForPermission(permission).includes(role);
}

export function getRoleLevel(role: DashboardRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}
