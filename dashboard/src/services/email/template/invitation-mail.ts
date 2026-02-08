import { createEmailButton, createEmailSignature, createTextEmailSignature } from './email-components';
import { EmailData, wrapEmailContent, wrapTextEmailContent } from '@/services/email/mail.service';
import escapeHtml from 'escape-html';
import { DashboardRole } from '@prisma/client';
import { env } from '@/lib/env';

export interface DashboardInvitationEmailData extends EmailData {
  inviterName: string;
  dashboardName: string;
  role: DashboardRole;
  inviteToken: string;
  userExists?: boolean;
}

function getRoleDisplayName(role: DashboardRole): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

export function generateInvitationEmailContent(data: DashboardInvitationEmailData): string {
  const acceptUrl = `${env.PUBLIC_BASE_URL}/en/accept-invite/${data.inviteToken}`;
  const roleDisplay = getRoleDisplayName(data.role);
  const buttonText = data.userExists ? 'Accept invitation' : 'Create account to accept';
  const accountNote = data.userExists
    ? 'Sign in to your Betterlytics account to accept this invitation.'
    : "You'll need to create a Betterlytics account to accept this invitation.";

  const content = `
    <h1>You've been invited to a dashboard!</h1>
    
    <p><strong>${escapeHtml(data.inviterName)}</strong> has invited you to collaborate on <strong>${escapeHtml(data.dashboardName)}</strong> on Betterlytics.</p>
    
    <p>You've been invited as a <strong>${roleDisplay}</strong>.</p>

    <div class="center" style="margin: 30px 0;">
      ${createEmailButton(buttonText, acceptUrl, 'primary')}
    </div>

    <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days.</p>

    <p>${accountNote}</p>

    ${createEmailSignature()}
  `;

  return content;
}

export function generateInvitationEmailText(data: DashboardInvitationEmailData): string {
  const acceptUrl = `${env.PUBLIC_BASE_URL}/en/accept-invite/${data.inviteToken}`;
  const roleDisplay = getRoleDisplayName(data.role);
  const accountNote = data.userExists
    ? 'Sign in to your Betterlytics account to accept this invitation.'
    : "You'll need to create a Betterlytics account to accept this invitation.";

  const content = `
You've been invited to a dashboard!

${escapeHtml(data.inviterName)} has invited you to collaborate on ${escapeHtml(data.dashboardName)} on Betterlytics.

You've been invited as a ${roleDisplay}.

Accept the invitation here: ${acceptUrl}

This invitation will expire in 7 days.

${accountNote}

${createTextEmailSignature()}`.trim();

  return content;
}

export function createDashboardInvitationEmailTemplate(data: DashboardInvitationEmailData) {
  return {
    subject: `${escapeHtml(data.inviterName)} invited you to collaborate on Betterlytics`,
    html: wrapEmailContent(generateInvitationEmailContent(data)),
    text: wrapTextEmailContent(generateInvitationEmailText(data)),
  };
}

export function getInvitationEmailPreview(data?: Partial<DashboardInvitationEmailData>): string {
  const sampleData: DashboardInvitationEmailData = {
    to: 'invitee@example.com',
    inviterName: data?.inviterName || 'John Doe',
    dashboardName: data?.dashboardName || 'example.com',
    role: data?.role || 'viewer',
    inviteToken: data?.inviteToken || 'sample-token-123',
    userExists: data?.userExists ?? false,
    ...data,
  };

  return createDashboardInvitationEmailTemplate(sampleData).html;
}
