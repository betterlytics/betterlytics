'use server';

import { DashboardRole } from '@prisma/client';
import {
  createInvitation,
  findInvitationsByDashboard,
  findInvitationByToken,
  findInvitationByEmail,
  updateInvitationStatus,
  findPendingInvitationsByEmail,
} from '@/repositories/postgres/invitation.repository';
import { findUserDashboardOrNull, addDashboardMember } from '@/repositories/postgres/dashboard.repository';
import { findUserByEmail } from '@/repositories/postgres/user.repository';
import { sendDashboardInvitationEmail } from '@/services/email/mail.service';
import { InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { hasPermission } from '@/lib/permissions';
import { UserException } from '@/lib/exceptions';

export async function inviteUserToDashboard(
  dashboardId: string,
  email: string,
  role: DashboardRole,
  invitedById: string,
): Promise<InvitationWithInviter> {
  const inviterAccess = await findUserDashboardOrNull({ userId: invitedById, dashboardId });

  if (!inviterAccess) {
    throw new Error('Inviter does not have access to this dashboard');
  }

  if (!hasPermission(inviterAccess.role, 'canInviteMembers')) {
    throw new Error('User does not have permission to invite members');
  }

  if (role === 'owner') {
    throw new Error('Cannot invite as owner');
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const existingAccess = await findUserDashboardOrNull({ userId: existingUser.id, dashboardId });
    if (existingAccess) {
      throw new UserException('User already has access to this dashboard');
    }
  }

  const existingInvitation = await findInvitationByEmail(dashboardId, email);

  if (existingInvitation) {
    throw new UserException('An invitation has already been sent to this email');
  }

  const invitation = await createInvitation({
    dashboardId,
    email,
    role,
    invitedById,
  });

  const invitations = await findInvitationsByDashboard(dashboardId);
  const fullInvitation = invitations.find((i) => i.id === invitation.id);

  if (!fullInvitation) {
    throw new Error('Failed to create invitation');
  }

  try {
    await sendDashboardInvitationEmail({
      to: email,
      inviterName: fullInvitation.invitedBy.name || 'Someone',
      dashboardName: fullInvitation.dashboard?.domain || dashboardId,
      role: role,
      inviteToken: invitation.token,
      userExists: !!existingUser,
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
  }

  return fullInvitation;
}

export async function cancelInvitation(invitationId: string, userId: string, dashboardId: string): Promise<void> {
  const userAccess = await findUserDashboardOrNull({ userId, dashboardId });

  if (!userAccess) {
    throw new Error('User does not have access to this dashboard');
  }

  if (!hasPermission(userAccess.role, 'canCancelInvitation')) {
    throw new Error('User does not have permission to cancel invitations');
  }

  await updateInvitationStatus(invitationId, 'cancelled');
}

export async function acceptInvitation(token: string, userId: string, userEmail: string): Promise<string> {
  const invitation = await findInvitationByToken(token);

  if (!invitation || invitation.status !== 'pending') {
    throw new UserException('Invitation not found or already processed');
  }

  if (new Date() > invitation.expiresAt) {
    await updateInvitationStatus(invitation.id, 'expired');
    throw new UserException('This invitation has expired');
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new UserException('This invitation was sent to a different email address');
  }

  const existingAccess = await findUserDashboardOrNull({ userId, dashboardId: invitation.dashboardId });

  if (existingAccess) {
    await updateInvitationStatus(invitation.id, 'accepted');
    return invitation.dashboardId;
  }

  await addDashboardMember(invitation.dashboardId, userId, invitation.role);
  await updateInvitationStatus(invitation.id, 'accepted');

  return invitation.dashboardId;
}

export async function declineInvitation(invitationId: string, userId: string, userEmail: string): Promise<void> {
  const invitations = await findPendingInvitationsByEmail(userEmail);
  const invitation = invitations.find((i) => i.id === invitationId);

  if (!invitation) {
    throw new UserException('Invitation not found');
  }

  await updateInvitationStatus(invitationId, 'declined');
}

export async function getPendingInvitations(dashboardId: string): Promise<InvitationWithInviter[]> {
  return findInvitationsByDashboard(dashboardId);
}

export type AcceptedInvitation = {
  dashboardId: string;
  dashboardDomain?: string;
  role: DashboardRole;
};

export async function acceptPendingInvitations(userId: string, email: string): Promise<AcceptedInvitation[]> {
  const invitations = await findPendingInvitationsByEmail(email);
  const accepted: AcceptedInvitation[] = [];

  for (const invitation of invitations) {
    if (new Date() > invitation.expiresAt) {
      await updateInvitationStatus(invitation.id, 'expired');
      continue;
    }

    try {
      await addDashboardMember(invitation.dashboardId, userId, invitation.role);
      accepted.push({
        dashboardId: invitation.dashboardId,
        dashboardDomain: invitation.dashboard?.domain,
        role: invitation.role,
      });
    } catch {}

    await updateInvitationStatus(invitation.id, 'accepted');
  }

  return accepted;
}

export async function getPendingInvitationsForUser(email: string): Promise<InvitationWithInviter[]> {
  return findPendingInvitationsByEmail(email);
}

export async function isUserInvited(email: string): Promise<boolean> {
  const invitations = await findPendingInvitationsByEmail(email);
  return invitations.length > 0;
}
