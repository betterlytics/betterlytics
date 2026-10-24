import { Section, Text } from '@react-email/components';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EmailData } from '@/services/email/types';
import { formatPercentage } from '@/utils/formatters';
import { EmailButton, EmailLayout, Greeting, H1, H2, P, renderEmailTemplate, withEmailUtm } from './_components';

const CAMPAIGN = 'usage_alert';

type SerializableDate = Date | string;

export type UsageAlertQuota = 'events' | 'replays';

export interface UsageAlertEmailData extends EmailData {
  userName?: string | null;
  /** Which plan quota the alert is about. Defaults to events. */
  quota?: UsageAlertQuota;
  currentUsage: number;
  usageLimit: number;
  usagePercentage: number;
  planName: string;
  currentPeriodStart: SerializableDate;
  currentPeriodEnd: SerializableDate;
  upgradeUrl: string;
}

type AlertSeverity = 'warning' | 'critical' | 'exceeded';

function getSeverity(percentage: number): AlertSeverity {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'critical';
  return 'warning';
}

function formatBillingDate(value: SerializableDate): string {
  return format(new Date(value), 'MMM d, yyyy');
}

type QuotaCopy = { limitName: string; unit: string; heading: string };

const QUOTA_COPY: Record<UsageAlertQuota, QuotaCopy> = {
  events: { limitName: 'event limit', unit: 'events', heading: 'Usage alert' },
  replays: { limitName: 'session replay limit', unit: 'recorded sessions', heading: 'Session replay usage alert' },
};

function getSubjectLine(percentage: number, planName: string, quota: UsageAlertQuota): string {
  const { limitName } = QUOTA_COPY[quota];
  if (quota === 'replays' && percentage >= 100) return `Usage alert: ${planName} plan ${limitName} reached`;
  if (percentage >= 100) return `Usage alert: ${planName} plan ${limitName} exceeded`;
  return `Usage alert: ${formatPercentage(percentage)} of your ${planName} plan ${limitName} used`;
}

type StatusCopy = { guidance: string; quotaWarning: string; ctaLabel: string; preview: string };

function getReplayStatusCopy(severity: AlertSeverity): StatusCopy {
  if (severity === 'exceeded') {
    return {
      guidance: 'Your account has reached the session replay limit included in your plan.',
      quotaWarning:
        'Session recording continues as normal. If you expect to record more sessions each month, take a look at the plan options to find one that fits.',
      ctaLabel: 'Review plan options',
      preview: 'Your account has reached the session replay limit included in your plan.',
    };
  }
  if (severity === 'critical') {
    return {
      guidance: 'Your account is close to the session replay limit included in your plan.',
      quotaWarning:
        'Session recording continues as normal. If you expect to record more sessions each month, take a look at the plan options to find one that fits.',
      ctaLabel: 'Review plan options',
      preview: 'Your account is close to the monthly session replay limit included in your plan.',
    };
  }
  return {
    guidance: 'Your account has crossed 80% of the session replay limit included in your plan.',
    quotaWarning: 'No action is required. Session recording continues as normal.',
    ctaLabel: 'Review plan options',
    preview: 'Your account has crossed 80% of the monthly session replay limit included in your plan.',
  };
}

function getStatusCopy(severity: AlertSeverity, quota: UsageAlertQuota): StatusCopy {
  if (quota === 'replays') return getReplayStatusCopy(severity);
  if (severity === 'exceeded') {
    return {
      guidance: 'Your account has exceeded the event limit included in your plan.',
      quotaWarning:
        'Please be aware that events above 100% of your plan limit may not be retained. Review your billing options to keep future data within plan.',
      ctaLabel: 'Review billing options',
      preview: 'Your account has exceeded the event limit included in your plan.',
    };
  }
  if (severity === 'critical') {
    return {
      guidance: 'Your account is close to the event limit included in your plan.',
      quotaWarning:
        'Please be aware that events above 100% of your plan limit may not be retained, so we recommend reviewing your billing options before usage reaches 100%.',
      ctaLabel: 'Review billing options',
      preview: 'Your account is close to the monthly event limit included in your plan.',
    };
  }
  return {
    guidance: 'Your account has crossed 80% of the event limit included in your plan.',
    quotaWarning:
      'No action is required yet, but please be aware that events above 100% of your plan limit may not be retained.',
    ctaLabel: 'Review billing options',
    preview: 'Your account has crossed 80% of the monthly event limit included in your plan.',
  };
}

export function UsageAlertEmail(data: UsageAlertEmailData) {
  const quota = data.quota ?? 'events';
  const quotaCopy = QUOTA_COPY[quota];
  const severity = getSeverity(data.usagePercentage);
  const statusCopy = getStatusCopy(severity, quota);
  const periodStart = formatBillingDate(data.currentPeriodStart);
  const periodEnd = formatBillingDate(data.currentPeriodEnd);
  const periodLabel = `${periodStart} to ${periodEnd}`;
  const remaining = Math.max(0, data.usageLimit - data.currentUsage);
  const remainingColorClass = remaining > 0 ? 'text-green-600' : 'text-red-600';
  const barColorClass =
    data.usagePercentage >= 100 ? 'bg-red-600' : data.usagePercentage >= 90 ? 'bg-amber-500' : 'bg-emerald-500';
  const barWidth = Math.min(100, data.usagePercentage);

  return (
    <EmailLayout preview={statusCopy.preview} campaign={CAMPAIGN}>
      <H1>{quotaCopy.heading}</H1>

      <Greeting userName={data.userName} className='m-0 mb-4' />

      <P className='m-0 mb-6'>
        {severity === 'exceeded' ? (
          <>
            Your account has {quota === 'replays' ? 'reached' : 'exceeded'} the {quotaCopy.limitName} included in
            your <strong>{data.planName}</strong> plan for <strong>{periodLabel}</strong>.
          </>
        ) : (
          <>
            You've used <strong>{formatPercentage(data.usagePercentage)}</strong> of the {quotaCopy.limitName}{' '}
            included in your <strong>{data.planName}</strong> plan for <strong>{periodLabel}</strong>.
          </>
        )}
      </P>

      <Section className='my-6 rounded-lg border border-slate-200 bg-slate-50 p-6'>
        <H2 className='mt-0 mb-3'>Current usage</H2>
        <P className='m-0 mb-4 text-slate-500'>{periodLabel}</P>
        <table cellPadding={0} cellSpacing={0} border={0} className='w-full border-collapse'>
          <tbody>
            <UsageRow label='Plan' value={`${data.planName} plan`} />
            <UsageRow label='Current usage' value={`${data.currentUsage.toLocaleString()} ${quotaCopy.unit}`} />
            <UsageRow label='Plan limit' value={`${data.usageLimit.toLocaleString()} ${quotaCopy.unit}`} />
            <UsageRow
              label='Remaining'
              value={`${remaining.toLocaleString()} ${quotaCopy.unit}`}
              valueClass={`font-semibold ${remainingColorClass}`}
            />
          </tbody>
        </table>
        <div className='mt-4 h-2 overflow-hidden rounded bg-slate-200'>
          <div className={cn(barColorClass, 'h-2 rounded')} style={{ width: `${barWidth}%` }} />
        </div>
        <Text className='m-0 mt-2 text-right text-sm text-slate-500'>
          {formatPercentage(data.usagePercentage)} used
        </Text>
      </Section>

      <P className='text-slate-600'>{statusCopy.guidance}</P>
      <P className='text-slate-600'>{statusCopy.quotaWarning}</P>

      <EmailButton href={withEmailUtm(data.upgradeUrl, CAMPAIGN, 'primary_cta')}>
        {statusCopy.ctaLabel}
      </EmailButton>

      <P className='text-sm text-slate-500'>
        Questions about your usage? Reply to this email or contact support@betterlytics.io.
      </P>
    </EmailLayout>
  );
}

function UsageRow({
  label,
  value,
  valueClass = 'font-semibold text-slate-800',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <tr>
      <td className='py-1 text-slate-500'>{label}</td>
      <td className={cn('py-1 text-right', valueClass)}>{value}</td>
    </tr>
  );
}

UsageAlertEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  currentUsage: 9500,
  usageLimit: 10000,
  usagePercentage: 85,
  planName: 'Growth',
  currentPeriodStart: new Date('2026-04-01T00:00:00.000Z'),
  currentPeriodEnd: new Date('2026-04-30T00:00:00.000Z'),
  upgradeUrl: 'https://betterlytics.io/billing',
} satisfies UsageAlertEmailData;

export default UsageAlertEmail;

export const createUsageAlertEmailTemplate = (data: UsageAlertEmailData) =>
  renderEmailTemplate(
    UsageAlertEmail,
    data,
    getSubjectLine(data.usagePercentage, data.planName, data.quota ?? 'events'),
  );
