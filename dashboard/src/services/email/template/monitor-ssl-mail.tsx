import type { MonitorSslEmailData } from '@/entities/system/monitorAlertEmail.entities';
import { P, renderEmailTemplate, subjectText } from './_components';
import { DetailRow, MonitorAlertShell, MonitorUrlRow, formatUtc } from './_monitor-alert';

const CAMPAIGN = 'monitor_ssl';

function daysLeftText(daysLeft: number): string {
  if (daysLeft <= 0) return 'Certificate has expired!';
  if (daysLeft === 1) return '1 day remaining';
  return `${daysLeft} days remaining`;
}

export function MonitorSslEmail({
  monitorName,
  url,
  expired,
  daysLeft,
  expiresAt,
  dashboardId,
  monitorId,
}: MonitorSslEmailData) {
  return (
    <MonitorAlertShell
      campaign={CAMPAIGN}
      preview={`The SSL certificate for ${monitorName} ${expired ? 'has expired' : 'is expiring soon'}`}
      heading='SSL Certificate Alert'
      variant={expired ? 'error' : 'warning'}
      boxTitle={expired ? 'SSL Certificate Expired' : 'SSL Certificate Expiring Soon'}
      boxBody={
        <>
          The SSL certificate for <strong>{monitorName}</strong> requires attention.
        </>
      }
      dashboardId={dashboardId}
      monitorId={monitorId}
      beforeCta={<P>Please renew your SSL certificate to avoid service disruption.</P>}
    >
      <MonitorUrlRow url={url} />
      <DetailRow label='Status'>{daysLeftText(daysLeft)}</DetailRow>
      {expiresAt && <DetailRow label='Expiry Date'>{formatUtc(expiresAt)}</DetailRow>}
    </MonitorAlertShell>
  );
}

MonitorSslEmail.PreviewProps = {
  to: 'owner@example.com',
  monitorName: 'example.com',
  url: 'https://example.com',
  expired: false,
  daysLeft: 7,
  expiresAt: '2026-01-22T00:00:00Z',
  dashboardId: 'dashboard-id',
  monitorId: 'monitor-id',
} satisfies MonitorSslEmailData;

export default MonitorSslEmail;

export const createMonitorSslEmailTemplate = (data: MonitorSslEmailData) =>
  renderEmailTemplate(
    MonitorSslEmail,
    data,
    data.expired
      ? `SSL Certificate Expired: ${subjectText(data.monitorName)}`
      : `SSL Certificate Expiring Soon: ${subjectText(data.monitorName)}`,
  );
