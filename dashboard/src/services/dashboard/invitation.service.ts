'server-only';

import { DashboardRole } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import {
  createInvitation,
  findPendingInvitationsByDashboard,
  findInvitationByToken,
  findInvitationByEmail,
  updateInvitationStatus,
  findPendingInvitationsByEmail,
  deleteInvitation,
} from '@/repositories/postgres/invitation.repository';
import {
  findUserDashboardOrNull,
  addDashboardMember,
  findDashboardMembers,
} from '@/repositories/postgres/dashboard.repository';
import { findUserByEmail } from '@/repositories/postgres/user.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createEmailRecipientKey, createUserRecipientKey } from '@/services/email/recipient-key.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { hasPermission } from '@/lib/permissions';
import { UserException } from '@/lib/exceptions';
import { getDashboardCapabilities } from '@/lib/billing/capabilityAccess';

export async function inviteUserToDashboard(
  dashboardId: string,
  email: string,
  role: DashboardRole,
  invitedById: string,
): Promise<InvitationWithInviter> {
  const t = await getTranslations('validation.invitations');
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
      throw new UserException(t('userAlreadyHasAccess'));
    }
  }

  const existingInvitation = await findInvitationByEmail(dashboardId, email);

  if (existingInvitation) {
    throw new UserException(t('invitationAlreadySent'));
  }

  const capabilities = await getDashboardCapabilities(dashboardId);
  const [currentMembers, pendingInvitations] = await Promise.all([
    findDashboardMembers(dashboardId),
    findPendingInvitationsByDashboard(dashboardId),
  ]);

  if (currentMembers.length + pendingInvitations.length >= capabilities.dashboards.maxMembers) {
    throw new UserException(t('memberLimitReached', { limit: capabilities.dashboards.maxMembers }));
  }

  const invitation = await createInvitation({
    dashboardId,
    email,
    role,
    invitedById,
  });

  const invitations = await findPendingInvitationsByDashboard(dashboardId);
  const fullInvitation = invitations.find((i) => i.id === invitation.id);

  if (!fullInvitation) {
    throw new Error('Failed to create invitation');
  }

  try {
    await enqueueEmail({
      type: 'dashboard-invitation',
      recipientKey: createEmailRecipientKey(email),
      campaignKey: `dashboard-invitation:${invitation.id}`,
      data: {
        to: email,
        inviterName: fullInvitation.invitedBy.name || 'Someone',
        dashboardName: fullInvitation.dashboard?.domain || dashboardId,
        role: role,
        inviteToken: invitation.token,
        userExists: !!existingUser,
      },
    });
  } catch (enqueueError) {
    await deleteInvitation(invitation.id).catch((cleanupError) => {
      console.error('Failed to roll back invitation after enqueue failure:', cleanupError);
    });
    throw enqueueError;
  }

  return fullInvitation;
}

export async function cancelInvitation(invitationId: string, userId: string, dashboardId: string): Promise<void> {
  const userAccess = await findUserDashboardOrNull({ userId, dashboardId });

  if (!userAccess) {
    throw new Error('User does not have access to this dashboard');
  }

  if (!hasPermission(userAccess.role, 'canInviteMembers')) {
    throw new Error('User does not have permission to cancel invitations');
  }

  await updateInvitationStatus(invitationId, 'cancelled');
}

export async function acceptInvitation(token: string, userId: string, userEmail: string): Promise<string> {
  const t = await getTranslations('validation.invitations');
  const invitation = await findInvitationByToken(token);

  if (!invitation || invitation.status !== 'pending') {
    throw new UserException(t('invitationNotFoundOrProcessed'));
  }

  if (new Date() > invitation.expiresAt) {
    await updateInvitationStatus(invitation.id, 'expired');
    throw new UserException(t('invitationExpired'));
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new UserException(t('invitationEmailMismatch'));
  }

  const existingAccess = await findUserDashboardOrNull({ userId, dashboardId: invitation.dashboardId });

  if (!existingAccess) {
    await addDashboardMember(invitation.dashboardId, userId, invitation.role);
  }

  await updateInvitationStatus(invitation.id, 'accepted');
  await sendInvitationAcceptedNotification(invitation, userEmail);

  return invitation.dashboardId;
}

async function sendInvitationAcceptedNotification(
  invitation: InvitationWithInviter,
  accepterEmail: string,
): Promise<void> {
  if (!invitation.invitedBy.email || !invitation.dashboard?.domain) return;
  try {
    await enqueueEmail({
      type: 'invitation-accepted',
      recipientKey: createUserRecipientKey(invitation.invitedBy.id),
      campaignKey: `invitation-accepted:${invitation.id}`,
      data: {
        to: invitation.invitedBy.email,
        inviterName: invitation.invitedBy.name,
        accepterEmail,
        dashboardDomain: invitation.dashboard.domain,
        dashboardUrl: `${sharedEmailEnv.publicBaseUrl}/dashboard/${invitation.dashboardId}/settings/members`,
        role: invitation.role,
      },
    });
  } catch (err) {
    console.error('Failed to enqueue invitation-accepted notification:', {
      invitationId: invitation.id,
      err,
    });
  }
}

export async function declineInvitation(invitationId: string, userEmail: string): Promise<void> {
  const t = await getTranslations('validation.invitations');
  const invitations = await findPendingInvitationsByEmail(userEmail);
  const invitation = invitations.find((i) => i.id === invitationId);

  if (!invitation) {
    throw new UserException(t('invitationNotFound'));
  }

  await updateInvitationStatus(invitationId, 'declined');
}

export async function getPendingInvitations(dashboardId: string): Promise<InvitationWithInviter[]> {
  return findPendingInvitationsByDashboard(dashboardId);
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
    } catch {
      // Ignore: user may already have access
    }

    await updateInvitationStatus(invitation.id, 'accepted');
    await sendInvitationAcceptedNotification(invitation, email);
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
