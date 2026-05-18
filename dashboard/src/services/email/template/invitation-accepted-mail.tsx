import type { EmailData } from '@/services/email/types';
import {
  EmailButton,
  EmailLayout,
  Greeting,
  H1,
  P,
  PrimaryLink,
  renderEmailTemplate,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'invitation_accepted';

export interface InvitationAcceptedEmailData extends EmailData {
  inviterName: string | null;
  accepterEmail: string;
  dashboardDomain: string;
  dashboardUrl: string;
}

export function InvitationAcceptedEmail({
  inviterName,
  accepterEmail,
  dashboardDomain,
  dashboardUrl,
}: InvitationAcceptedEmailData) {
  return (
    <EmailLayout preview={`${accepterEmail} accepted your invitation to ${dashboardDomain}`} campaign={CAMPAIGN}>
      <H1>Your invitation was accepted</H1>

      <Greeting userName={inviterName} />

      <P>
        <strong>{accepterEmail}</strong> just accepted your invitation to{' '}
        <strong>{dashboardDomain}</strong>. They now have access to the dashboard.
      </P>

      <EmailButton href={withEmailUtm(dashboardUrl, CAMPAIGN, 'primary_cta')}>View members</EmailButton>

      <P className='text-sm text-slate-500'>
        Questions? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

InvitationAcceptedEmail.PreviewProps = {
  to: 'user@example.com',
  inviterName: 'John Doe',
  accepterEmail: 'alice@example.com',
  dashboardDomain: 'example.com',
  dashboardUrl: 'https://betterlytics.io/dashboard/abc123/settings/members',
} satisfies InvitationAcceptedEmailData;

export default InvitationAcceptedEmail;

export const createInvitationAcceptedEmailTemplate = (data: InvitationAcceptedEmailData) =>
  renderEmailTemplate(
    InvitationAcceptedEmail,
    data,
    `${data.accepterEmail} accepted your invitation to ${data.dashboardDomain}`,
  );
