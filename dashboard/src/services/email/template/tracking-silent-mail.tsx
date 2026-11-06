import moment from 'moment-timezone';
import type { EmailData } from '@/services/email/types';
import { normalizeTimezone } from '@/utils/timezone';
import {
  EmailButton,
  EmailLayout,
  Greeting,
  H1,
  P,
  PrimaryLink,
  renderEmailTemplate,
  subjectText,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'tracking_silent';

export interface TrackingSilentEmailData extends EmailData {
  userName: string | null;
  domain: string;
  lastEventAt: string;
  timeZone: string | null;
  installGuideUrl: string;
}

export function formatLastReceived(lastEventAt: string, timeZone: string | null): string {
  const zone = normalizeTimezone(timeZone);
  const formatted = moment.tz(lastEventAt, zone ?? 'UTC').format('MMMM D, YYYY [at] HH:mm');
  return zone ? `${formatted} (${zone})` : `${formatted} UTC`;
}

export function TrackingSilentEmail({
  userName,
  domain,
  lastEventAt,
  timeZone,
  installGuideUrl,
}: TrackingSilentEmailData) {
  const lastReceived = formatLastReceived(lastEventAt, timeZone);

  return (
    <EmailLayout preview={`We stopped receiving data from ${domain}`} campaign={CAMPAIGN}>
      <H1>We stopped receiving data</H1>

      <Greeting userName={userName} />

      <P>
        We haven't received any events from <strong>{domain}</strong> since <strong>{lastReceived}</strong>. Until
        then it was sending data every day, so something has likely changed: a deploy that removed the tracking
        snippet, a new Content Security Policy, or the site itself being down.
      </P>

      <P>
        Every day without tracking is data you can't get back. Check your installation and use the "Verify
        installation" button to confirm events are arriving again.
      </P>

      <EmailButton href={withEmailUtm(installGuideUrl, CAMPAIGN, 'primary_cta')}>Check installation</EmailButton>

      <P>
        If the snippet is still in place, our{' '}
        <PrimaryLink
          href={withEmailUtm('https://betterlytics.io/docs/troubleshooting', CAMPAIGN, 'troubleshooting')}
        >
          troubleshooting guide
        </PrimaryLink>{' '}
        walks through the most common reasons events stop arriving.
      </P>

      <P className='text-sm text-slate-500'>
        Need a hand? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink> and we'll take a
        look.
      </P>
    </EmailLayout>
  );
}

TrackingSilentEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  domain: 'example.com',
  lastEventAt: '2026-07-24T14:32:00.000Z',
  timeZone: 'Europe/Copenhagen',
  installGuideUrl: 'https://betterlytics.io/dashboard/abc123?showIntegration=true',
} satisfies TrackingSilentEmailData;

export default TrackingSilentEmail;

export const createTrackingSilentEmailTemplate = (data: TrackingSilentEmailData) =>
  renderEmailTemplate(TrackingSilentEmail, data, `We stopped receiving data from ${subjectText(data.domain)}`);
