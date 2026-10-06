import type { MonitorRecoveryEmailData } from '@/entities/system/monitorAlertEmail.entities';
import { renderEmailTemplate, subjectText } from './_components';
import { DetailRow, MonitorAlertShell, MonitorUrlRow, formatDowntime, formatUtc } from './_monitor-alert';

const CAMPAIGN = 'monitor_recovery';

export function MonitorRecoveryEmail({
  monitorName,
  url,
  recoveredAt,
  downtimeSeconds,
  dashboardId,
  monitorId,
}: MonitorRecoveryEmailData) {
  return (
    <MonitorAlertShell
      campaign={CAMPAIGN}
      preview={`${monitorName} is back online`}
      heading='Monitor Recovered'
      variant='success'
      boxTitle='Back Online'
      boxBody={
        <>
          <strong>{monitorName}</strong> is now responding normally.
        </>
      }
      dashboardId={dashboardId}
      monitorId={monitorId}
    >
      <MonitorUrlRow url={url} />
      <DetailRow label='Recovered At'>{formatUtc(recoveredAt)}</DetailRow>
      {downtimeSeconds !== undefined && (
        <DetailRow label='Downtime Duration'>{formatDowntime(downtimeSeconds)}</DetailRow>
      )}
    </MonitorAlertShell>
  );
}

MonitorRecoveryEmail.PreviewProps = {
  to: 'owner@example.com',
  monitorName: 'example.com',
  url: 'https://example.com',
  recoveredAt: '2026-01-15T11:02:00Z',
  downtimeSeconds: 1920,
  dashboardId: 'dashboard-id',
  monitorId: 'monitor-id',
} satisfies MonitorRecoveryEmailData;

export default MonitorRecoveryEmail;

export const createMonitorRecoveryEmailTemplate = (data: MonitorRecoveryEmailData) =>
  renderEmailTemplate(
    MonitorRecoveryEmail,
    data,
    `Resolved: Site Is Back Online: ${subjectText(data.monitorName)}`,
  );
