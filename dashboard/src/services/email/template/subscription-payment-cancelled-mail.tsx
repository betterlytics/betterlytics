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

const CAMPAIGN = 'subscription_payment_cancelled';
const MAX_DASHBOARDS_LISTED = 3;

export interface SubscriptionPaymentCancelledEmailData extends EmailData {
  userName: string | null;
  billingUrl: string;
  freeEventLimit: number;
  freeRetentionDays: number;
  affectedDashboards: string[];
}

function describeAffectedDashboards(domains: string[]): string {
  if (domains.length <= MAX_DASHBOARDS_LISTED) {
    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
    const noun = domains.length === 1 ? 'dashboard' : 'dashboards';
    return `your ${formatter.format(domains)} ${noun}`;
  }
  return `${domains.length} of your dashboards`;
}

export function SubscriptionPaymentCancelledEmail({
  userName,
  billingUrl,
  freeEventLimit,
  freeRetentionDays,
  affectedDashboards,
}: SubscriptionPaymentCancelledEmailData) {
  const affectedDescription = describeAffectedDashboards(affectedDashboards);

  return (
    <EmailLayout
      preview='Update your payment method to restore your subscription.'
      campaign={CAMPAIGN}
    >
      <H1>Your subscription was cancelled</H1>

      <Greeting userName={userName} />

      <P>Thanks for being a Betterlytics customer.</P>

      <P>
        Your subscription was cancelled because we couldn't process payment on your card after several attempts.
        We're sorry this happened. Your account is still here whenever you're ready to come back.
      </P>

      <P>
        Your account has been moved to the free Growth plan ({freeEventLimit.toLocaleString()} events/month). To
        restore your previous plan, update your payment method and resubscribe from your billing page.
      </P>

      {affectedDashboards.length > 0 && (
        <P>
          Data retention on {affectedDescription} has been reduced to the free plan's {freeRetentionDays}-day
          limit. You have 30 days to restore your subscription and keep your previous retention. Otherwise, any
          events older than the new limit will be removed.
        </P>
      )}

      <EmailButton href={withEmailUtm(billingUrl, CAMPAIGN, 'primary_cta')}>Restore your subscription</EmailButton>

      <P>
        Common causes are a declined card, expired card, or insufficient funds. Updating your payment details
        usually resolves the issue.
      </P>

      <P className='text-sm text-slate-500'>
        Questions? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

SubscriptionPaymentCancelledEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  billingUrl: 'https://betterlytics.io/billing',
  freeEventLimit: 10_000,
  freeRetentionDays: 365,
  affectedDashboards: ['example.com', 'shop.example.com'],
} satisfies SubscriptionPaymentCancelledEmailData;

export default SubscriptionPaymentCancelledEmail;

export const createSubscriptionPaymentCancelledEmailTemplate = (data: SubscriptionPaymentCancelledEmailData) =>
  renderEmailTemplate(SubscriptionPaymentCancelledEmail, data, 'Your Betterlytics subscription was cancelled');
