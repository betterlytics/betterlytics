import { format } from 'date-fns';
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

const CAMPAIGN = 'subscription_ending_soon';
const MAX_DASHBOARDS_LISTED = 3;

type SerializableDate = Date | string;

export interface SubscriptionEndingSoonEmailData extends EmailData {
  userName: string | null;
  periodEnd: SerializableDate;
  billingUrl: string;
  freeEventLimit: number;
  freeRetentionDays: number;
  affectedDashboards: string[];
}

function formatEndDate(value: SerializableDate): string {
  return format(new Date(value), 'MMMM d, yyyy');
}

function describeAffectedDashboards(domains: string[]): string {
  if (domains.length <= MAX_DASHBOARDS_LISTED) {
    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
    const noun = domains.length === 1 ? 'dashboard' : 'dashboards';
    return `your ${formatter.format(domains)} ${noun}`;
  }
  return `${domains.length} of your dashboards`;
}

export function SubscriptionEndingSoonEmail({
  userName,
  periodEnd,
  billingUrl,
  freeEventLimit,
  freeRetentionDays,
  affectedDashboards,
}: SubscriptionEndingSoonEmailData) {
  const endDate = formatEndDate(periodEnd);
  const affectedDescription = describeAffectedDashboards(affectedDashboards);

  return (
    <EmailLayout
      preview={`After ${endDate}, your account moves to the free Growth plan.`}
      campaign={CAMPAIGN}
    >
      <H1>Your subscription ends soon</H1>

      <Greeting userName={userName} />

      <P>Thanks for being a Betterlytics customer.</P>

      <P>
        Your subscription is scheduled to end on <strong>{endDate}</strong>. After that, your account will be moved
        to the free Growth plan ({freeEventLimit.toLocaleString()} events/month).
      </P>

      {affectedDashboards.length > 0 && (
        <P>
          Data retention on {affectedDescription} is set higher than the free plan's {freeRetentionDays}-day limit.
          After cancellation, you'll have 30 days to reactivate. Otherwise, any events older than the new limit
          will be removed.
        </P>
      )}

      <P>
        If you want to keep your current plan, you can reactivate before then from your billing page. No further
        action is needed if you'd like the cancellation to go ahead as scheduled.
      </P>

      <EmailButton href={withEmailUtm(billingUrl, CAMPAIGN, 'primary_cta')}>Reactivate subscription</EmailButton>

      <P className='text-sm text-slate-500'>
        Questions? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

SubscriptionEndingSoonEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  periodEnd: new Date('2026-06-15T00:00:00.000Z'),
  billingUrl: 'https://betterlytics.io/billing',
  freeEventLimit: 10_000,
  freeRetentionDays: 365,
  affectedDashboards: ['example.com', 'shop.example.com'],
} satisfies SubscriptionEndingSoonEmailData;

export default SubscriptionEndingSoonEmail;

export const createSubscriptionEndingSoonEmailTemplate = (data: SubscriptionEndingSoonEmailData) =>
  renderEmailTemplate(
    SubscriptionEndingSoonEmail,
    data,
    `Your Betterlytics subscription ends on ${formatEndDate(data.periodEnd)}`,
  );
