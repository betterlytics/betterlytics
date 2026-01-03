import prisma from '@/lib/postgres';
import { InvitationStatus } from '@prisma/client';
import {
  DashboardInvitation,
  DashboardInvitationSchema,
  CreateInvitationData,
  CreateInvitationSchema,
  InvitationWithInviter,
  InvitationWithInviterSchema,
} from '@/entities/dashboard/invitation.entities';

const INVITATION_EXPIRY_DAYS = 7;

export async function createInvitation(data: CreateInvitationData): Promise<DashboardInvitation> {
  try {
    const validatedData = CreateInvitationSchema.parse(data);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await prisma.dashboardInvitation.create({
      data: {
        dashboardId: validatedData.dashboardId,
        email: validatedData.email.toLowerCase(),
        role: validatedData.role,
        invitedById: validatedData.invitedById,
        expiresAt,
      },
    });

    return DashboardInvitationSchema.parse(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw new Error('Failed to create invitation');
  }
}

export async function findInvitationsByDashboard(dashboardId: string): Promise<InvitationWithInviter[]> {
  try {
    const invitations = await prisma.dashboardInvitation.findMany({
      where: {
        dashboardId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dashboard: {
          select: {
            id: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => InvitationWithInviterSchema.parse(inv));
  } catch (error) {
    console.error('Error finding invitations:', error);
    throw new Error('Failed to find invitations');
  }
}

export async function findInvitationByToken(token: string): Promise<InvitationWithInviter | null> {
  try {
    const invitation = await prisma.dashboardInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dashboard: {
          select: {
            id: true,
            domain: true,
          },
        },
      },
    });

    if (!invitation) return null;

    return InvitationWithInviterSchema.parse(invitation);
  } catch (error) {
    console.error('Error finding invitation by token:', error);
    return null;
  }
}

export async function findInvitationByEmail(
  dashboardId: string,
  email: string,
): Promise<DashboardInvitation | null> {
  try {
    const invitation = await prisma.dashboardInvitation.findFirst({
      where: {
        dashboardId,
        email: email.toLowerCase(),
        status: 'pending',
      },
    });

    if (!invitation) return null;

    return DashboardInvitationSchema.parse(invitation);
  } catch (error) {
    console.error('Error finding invitation by email:', error);
    return null;
  }
}

export async function updateInvitationStatus(invitationId: string, status: InvitationStatus): Promise<void> {
  try {
    await prisma.dashboardInvitation.update({
      where: { id: invitationId },
      data: { status },
    });
  } catch (error) {
    console.error('Error updating invitation status:', error);
    throw new Error('Failed to update invitation status');
  }
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  try {
    await prisma.dashboardInvitation.delete({
      where: { id: invitationId },
    });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    throw new Error('Failed to delete invitation');
  }
}

export async function markExpiredInvitations(): Promise<number> {
  try {
    const result = await prisma.dashboardInvitation.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
    return result.count;
  } catch (error) {
    console.error('Error marking expired invitations:', error);
    return 0;
  }
}

export async function findPendingInvitationsByEmail(email: string): Promise<InvitationWithInviter[]> {
  try {
    const invitations = await prisma.dashboardInvitation.findMany({
      where: {
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dashboard: {
          select: {
            id: true,
            domain: true,
          },
        },
      },
    });

    return invitations.map((inv) => InvitationWithInviterSchema.parse(inv));
  } catch (error) {
    console.error('Error finding invitations by email:', error);
    return [];
  }
}
