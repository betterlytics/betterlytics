import type { EmailData } from '@/services/email/types';
import { EmailLayout, Greeting, H1, P, PrimaryLink, renderEmailTemplate } from './_components';

const CAMPAIGN = 'member_removed';

export interface MemberRemovedEmailData extends EmailData {
  userName: string | null;
  dashboardDomain: string;
}

export function MemberRemovedEmail({ userName, dashboardDomain }: MemberRemovedEmailData) {
  return (
    <EmailLayout preview={`Your access to ${dashboardDomain} has been revoked`} campaign={CAMPAIGN}>
      <H1>Your access has been revoked</H1>

      <Greeting userName={userName} />

      <P>
        Your access to <strong>{dashboardDomain}</strong> has been removed. You no longer have visibility into
        this dashboard.
      </P>

      <P>
        If you think this was a mistake, reach out to the dashboard's owner or admin — they can re-invite you.
      </P>

      <P className='text-sm text-slate-500'>
        Questions? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

MemberRemovedEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'Alice',
  dashboardDomain: 'example.com',
} satisfies MemberRemovedEmailData;

export default MemberRemovedEmail;

export const createMemberRemovedEmailTemplate = (data: MemberRemovedEmailData) =>
  renderEmailTemplate(MemberRemovedEmail, data, `Your access to ${data.dashboardDomain} has been revoked`);
