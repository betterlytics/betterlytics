'use server';

import { DashboardRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  inviteUserToDashboard,
  cancelInvitation,
  getPendingInvitations,
  getPendingInvitationsForUser,
  acceptInvitation,
  declineInvitation,
  acceptPendingInvitations,
} from '@/services/dashboard/invitation.service';
import { InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext, withUserAuth } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { User } from 'next-auth';

export const getPendingInvitationsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<InvitationWithInviter[]> => {
    return getPendingInvitations(ctx.dashboardId);
  },
);

export const inviteMemberAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, email: string, role: DashboardRole): Promise<void> => {
    await inviteUserToDashboard(ctx.dashboardId, email, role, ctx.userId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/members`);
  },
  { permission: 'canInviteMembers' },
);

export const cancelInvitationAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, invitationId: string): Promise<void> => {
    await cancelInvitation(invitationId, ctx.userId, ctx.dashboardId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/members`);
  },
  { permission: 'canCancelInvitation' },
);

export const getUserPendingInvitationsAction = withUserAuth(
  async (user: User): Promise<InvitationWithInviter[]> => {
    return getPendingInvitationsForUser(user.email);
  },
);

export const acceptInvitationAction = withUserAuth(async (user: User, token: string): Promise<string> => {
  const dashboardId = await acceptInvitation(token, user.id, user.email);
  revalidatePath('/dashboards');

  return dashboardId;
});

export const declineInvitationAction = withUserAuth(async (user: User, invitationId: string): Promise<void> => {
  await declineInvitation(invitationId, user.id, user.email);
});

export const acceptPendingInvitationsAction = withUserAuth(async (user: User) => {
  return acceptPendingInvitations(user.id, user.email);
});
