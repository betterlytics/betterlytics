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

const CAMPAIGN = 'setup_help';

export interface SetupHelpEmailData extends EmailData {
  userName: string | null;
  domain: string;
  installGuideUrl: string;
}

export function SetupHelpEmail({ userName, domain, installGuideUrl }: SetupHelpEmailData) {
  return (
    <EmailLayout preview={`We haven't recorded any traffic on ${domain} yet`} campaign={CAMPAIGN}>
      <H1>No traffic recorded yet</H1>

      <Greeting userName={userName} />

      <P>
        We haven't recorded any traffic on <strong>{domain}</strong> yet. Most of the time this means the tracking
        snippet hasn't been installed yet, or something is preventing it from running.
      </P>

      <P>
        The install guide has step-by-step instructions for your framework. When you're ready, paste the snippet
        and the "Verify installation" button will confirm the moment events start arriving.
      </P>

      <EmailButton href={withEmailUtm(installGuideUrl, CAMPAIGN, 'primary_cta')}>Open install guide</EmailButton>

      <P>
        If you've already installed the snippet and it still isn't working, our{' '}
        <PrimaryLink href={withEmailUtm('https://betterlytics.io/docs/troubleshooting', CAMPAIGN, 'troubleshooting')}>
          troubleshooting guide
        </PrimaryLink>{' '}
        walks through the most common reasons events fail to arrive.
      </P>

      <P className='text-sm text-slate-500'>
        Still stuck? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink> and we'll take a
        look.
      </P>
    </EmailLayout>
  );
}

SetupHelpEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  domain: 'example.com',
  installGuideUrl: 'https://betterlytics.io/dashboard/abc123?showIntegration=true',
} satisfies SetupHelpEmailData;

export default SetupHelpEmail;

export const createSetupHelpEmailTemplate = (data: SetupHelpEmailData) =>
  renderEmailTemplate(SetupHelpEmail, data, `No traffic recorded yet on ${data.domain}`);
