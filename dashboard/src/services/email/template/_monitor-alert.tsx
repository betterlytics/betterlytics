import { Text } from '@react-email/components';
import type { ReactNode } from 'react';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { toDateTimeString } from '@/utils/dateFormatters';
import { ContentSection, EmailButton, EmailLayout, H1, InfoBox, PrimaryLink, withEmailUtm } from './_components';

type AlertVariant = 'error' | 'success' | 'warning';

const BUTTON_VARIANT: Record<AlertVariant, 'danger' | 'success' | 'warning'> = {
  error: 'danger',
  success: 'success',
  warning: 'warning',
};

type MonitorAlertShellProps = {
  campaign: string;
  preview: string;
  heading: string;
  variant: AlertVariant;
  boxTitle: string;
  boxBody: ReactNode;
  dashboardId: string;
  monitorId: string;
  /** Detail rows. */
  children: ReactNode;
  beforeCta?: ReactNode;
  afterCta?: ReactNode;
};

export function MonitorAlertShell({
  campaign,
  preview,
  heading,
  variant,
  boxTitle,
  boxBody,
  dashboardId,
  monitorId,
  children,
  beforeCta,
  afterCta,
}: MonitorAlertShellProps) {
  const detailsUrl = `${sharedEmailEnv.publicBaseUrl}/dashboard/${dashboardId}/monitoring/${monitorId}`;

  return (
    <EmailLayout preview={preview} campaign={campaign} signature={null}>
      <H1>{heading}</H1>

      <InfoBox variant={variant} title={boxTitle}>
        <Text className='m-0 text-base text-slate-700'>{boxBody}</Text>
      </InfoBox>

      <ContentSection>{children}</ContentSection>

      {beforeCta}

      <EmailButton href={withEmailUtm(detailsUrl, campaign, 'primary_cta')} variant={BUTTON_VARIANT[variant]}>
        View Monitor Details
      </EmailButton>

      {afterCta}
    </EmailLayout>
  );
}

export function formatUtc(iso: string): string {
  return `${toDateTimeString(iso)} UTC`;
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

/** "45 seconds", "5 min 30 sec", "2 hr 5 min", "3 days 4 hr" */
export function formatDowntime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} seconds`;
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds === 0 ? plural(minutes, 'minute') : `${minutes} min ${seconds} sec`;
  }
  if (totalSeconds < 86400) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return minutes === 0 ? plural(hours, 'hour') : `${hours} hr ${minutes} min`;
  }
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  return hours === 0 ? plural(days, 'day') : `${plural(days, 'day')} ${hours} hr`;
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Text className='my-2 text-base leading-relaxed text-slate-600'>
      <strong>{label}:</strong> {children}
    </Text>
  );
}

export function MonitorUrlRow({ url }: { url: string }) {
  return (
    <DetailRow label='URL'>
      <PrimaryLink href={url}>{url}</PrimaryLink>
    </DetailRow>
  );
}
