import { render } from '@react-email/render';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import type { EmailData, EmailTemplate } from '@/services/email/types';
import { DashboardRole } from '@prisma/client';
import { EmailButton, EmailLayout, H1, P } from './_components';

export interface DashboardInvitationEmailData extends EmailData {
  inviterName: string;
  dashboardName: string;
  role: DashboardRole;
  inviteToken: string;
  userExists?: boolean;
}

const ROLE_DISPLAY: Record<DashboardRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export function DashboardInvitationEmail({
  inviterName,
  dashboardName,
  role,
  inviteToken,
  userExists,
}: DashboardInvitationEmailData) {
  const acceptUrl = `${sharedEmailEnv.publicBaseUrl}/en/accept-invite/${inviteToken}`;
  const roleDisplay = ROLE_DISPLAY[role];
  const buttonText = userExists ? 'Accept invitation' : 'Create account to accept';
  const accountNote = userExists
    ? 'Sign in to your Betterlytics account to accept this invitation.'
    : "You'll need to create a Betterlytics account to accept this invitation.";

  return (
    <EmailLayout preview={`${inviterName} invited you to collaborate on ${dashboardName}`}>
      <H1>You've been invited to a dashboard!</H1>

      <P>
        <strong>{inviterName}</strong> has invited you to collaborate on <strong>{dashboardName}</strong> on
        Betterlytics.
      </P>

      <P>
        You've been invited as a <strong>{roleDisplay}</strong>.
      </P>

      <EmailButton href={acceptUrl}>{buttonText}</EmailButton>

      <P className="text-sm text-slate-500">This invitation will expire in 7 days.</P>

      <P>{accountNote}</P>
    </EmailLayout>
  );
}

DashboardInvitationEmail.PreviewProps = {
  to: 'invitee@example.com',
  inviterName: 'John Doe',
  dashboardName: 'example.com',
  role: 'viewer' as DashboardRole,
  inviteToken: 'sample-token-123',
  userExists: false,
} satisfies DashboardInvitationEmailData;

export default DashboardInvitationEmail;

export async function createDashboardInvitationEmailTemplate(
  data: DashboardInvitationEmailData,
): Promise<EmailTemplate> {
  const el = <DashboardInvitationEmail {...data} />;
  const [html, text] = await Promise.all([render(el), render(el, { plainText: true })]);
  return {
    subject: `${data.inviterName} invited you to collaborate on Betterlytics`,
    html,
    text,
  };
}

export async function getInvitationEmailPreview(
  data?: Partial<DashboardInvitationEmailData>,
): Promise<string> {
  return render(<DashboardInvitationEmail {...{ ...DashboardInvitationEmail.PreviewProps, ...data }} />);
}
