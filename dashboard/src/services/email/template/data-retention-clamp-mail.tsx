import { format } from 'date-fns';
import type { EmailData } from '@/services/email/types';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import {
  ContentSection,
  EmailButton,
  EmailLayout,
  H1,
  H2,
  InfoBox,
  P,
  PrimaryLink,
  renderEmailTemplate,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'data_retention_clamp';

type SerializableDate = Date | string;

export interface DataRetentionClampEmailData extends EmailData {
  userName: string;
  newPlanName: string;
  previousRetentionDays: number;
  newRetentionDays: number;
  graceUntil: SerializableDate;
  upgradeUrl: string;
}

function formatDays(days: number): string {
  return DATA_RETENTION_PRESETS.find((p) => p.value === days)?.fallback ?? `${days} days`;
}

function formatGraceDate(value: SerializableDate): string {
  return format(new Date(value), 'MMMM d, yyyy');
}

export function DataRetentionClampEmail(data: DataRetentionClampEmailData) {
  const previous = formatDays(data.previousRetentionDays);
  const next = formatDays(data.newRetentionDays);
  const graceDate = formatGraceDate(data.graceUntil);

  return (
    <EmailLayout
      preview={`Your data retention has been reduced to ${next} on the ${data.newPlanName} plan`}
      campaign={CAMPAIGN}
    >
      <H1>Your data retention has changed</H1>

      <P>
        Hi <strong>{data.userName}</strong>,
      </P>

      <P>We're letting you know about a change to your data retention as a result of your recent plan change.</P>

      <InfoBox variant='warning' title='Data retention reduced'>
        <P className='m-0 mt-2 text-slate-500'>
          Your <strong>{data.newPlanName}</strong> plan supports up to <strong>{next}</strong> of data retention.
          Your retention setting was previously <strong>{previous}</strong> and has been adjusted down to fit the
          new plan.
        </P>
        <P className='m-0 mt-2 font-semibold text-amber-600'>
          Events older than {next} will be deleted on <strong>{graceDate}</strong> unless you upgrade before then.
        </P>
      </InfoBox>

      <ContentSection>
        <H2 className='mt-0'>What happens next</H2>
        <P className='text-slate-600'>
          We hold your historical data unchanged until <strong>{graceDate}</strong>. After that date, the next
          scheduled cleanup will permanently delete events older than {next}. If you upgrade to a plan that
          supports your previous retention window before then, we restore it automatically.
        </P>
        <EmailButton href={withEmailUtm(data.upgradeUrl, CAMPAIGN, 'primary_cta')}>Upgrade Your Plan</EmailButton>
      </ContentSection>

      <P>
        Questions? Reach out to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

DataRetentionClampEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  newPlanName: 'Growth',
  previousRetentionDays: 1095,
  newRetentionDays: 365,
  graceUntil: new Date('2026-06-15T00:00:00.000Z'),
  upgradeUrl: 'https://betterlytics.io/billing',
} satisfies DataRetentionClampEmailData;

export default DataRetentionClampEmail;

export const createDataRetentionClampEmailTemplate = (data: DataRetentionClampEmailData) =>
  renderEmailTemplate(DataRetentionClampEmail, data, `Data retention reduced on your ${data.newPlanName} plan`);
