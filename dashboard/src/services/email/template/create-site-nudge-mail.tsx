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

const CAMPAIGN = 'create_site_nudge';
const SUBJECT = 'Add your first site to start tracking';

export interface CreateSiteNudgeEmailData extends EmailData {
  userName: string | null;
  dashboardsUrl: string;
}

export function CreateSiteNudgeEmail({ userName, dashboardsUrl }: CreateSiteNudgeEmailData) {
  return (
    <EmailLayout preview="You haven't added a site yet — adding one only takes a minute" campaign={CAMPAIGN}>
      <H1>Add your first site</H1>

      <Greeting userName={userName} />

      <P>
        You've created your Betterlytics account but haven't added a site yet. Whenever you're ready, adding one
        only takes a minute — drop in your domain and you'll be set up to install the tracking snippet.
      </P>

      <EmailButton href={withEmailUtm(dashboardsUrl, CAMPAIGN, 'primary_cta')}>Add your first site</EmailButton>

      <P className='text-sm text-slate-500'>
        Stuck on something? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

CreateSiteNudgeEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  dashboardsUrl: 'https://betterlytics.io/dashboards',
} satisfies CreateSiteNudgeEmailData;

export default CreateSiteNudgeEmail;

export const createCreateSiteNudgeEmailTemplate = (data: CreateSiteNudgeEmailData) =>
  renderEmailTemplate(CreateSiteNudgeEmail, data, SUBJECT);
