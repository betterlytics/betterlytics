import type { EmailData } from '@/services/email/types';
import { EmailButton, EmailLayout, Greeting, H1, P, renderEmailTemplate, withEmailUtm } from './_components';

const CAMPAIGN = 'first_visitor_detected';

export interface FirstVisitorDetectedEmailData extends EmailData {
  userName: string | null;
  domain: string;
  dashboardUrl: string;
}

export function FirstVisitorDetectedEmail({ userName, domain, dashboardUrl }: FirstVisitorDetectedEmailData) {
  return (
    <EmailLayout preview={`Your first visitor just landed on ${domain}`} campaign={CAMPAIGN}>
      <H1>Your first visitor just landed</H1>

      <Greeting userName={userName} />

      <P>
        Good news — your first visitor just landed on <strong>{domain}</strong>. Your tracking is working and the
        data is flowing in.
      </P>

      <EmailButton href={withEmailUtm(dashboardUrl, CAMPAIGN, 'primary_cta')}>View your dashboard</EmailButton>
    </EmailLayout>
  );
}

FirstVisitorDetectedEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  domain: 'example.com',
  dashboardUrl: 'https://betterlytics.io/dashboard/abc123',
} satisfies FirstVisitorDetectedEmailData;

export default FirstVisitorDetectedEmail;

export const createFirstVisitorDetectedEmailTemplate = (data: FirstVisitorDetectedEmailData) =>
  renderEmailTemplate(FirstVisitorDetectedEmail, data, `Your first visitor just landed on ${data.domain}`);
