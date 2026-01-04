'use server';

import { DashboardRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  getDashboardMembers,
  updateMemberRole,
  removeMemberFromDashboard,
  leaveDashboard,
} from '@/services/dashboard/members.service';
import { DashboardMember } from '@/entities/dashboard/invitation.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';

export const getMembersAction = withDashboardAuthContext(async (ctx: AuthContext): Promise<DashboardMember[]> => {
  return getDashboardMembers(ctx.dashboardId);
});

export const updateMemberRoleAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, userId: string, newRole: DashboardRole): Promise<void> => {
    await updateMemberRole(ctx.dashboardId, userId, newRole, ctx.userId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/members`);
  },
  { permission: 'canChangeMemberRole' },
);

export const removeMemberAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, userId: string): Promise<void> => {
    await removeMemberFromDashboard(ctx.dashboardId, userId, ctx.userId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/members`);
  },
  { permission: 'canRemoveMembers' },
);

export const leaveDashboardAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext): Promise<void> => {
    await leaveDashboard(ctx.dashboardId, ctx.userId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/members`);
  },
  { permission: 'canRemoveMembers' },
);
