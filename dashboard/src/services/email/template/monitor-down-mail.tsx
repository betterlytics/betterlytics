import type { MonitorDownEmailData } from '@/entities/system/monitorAlertEmail.entities';
import { P, renderEmailTemplate, subjectText } from './_components';
import { DetailRow, MonitorAlertShell, MonitorUrlRow, formatUtc } from './_monitor-alert';

const CAMPAIGN = 'monitor_down';

export function MonitorDownEmail({
  monitorName,
  url,
  reason,
  statusCode,
  detectedAt,
  dashboardId,
  monitorId,
}: MonitorDownEmailData) {
  return (
    <MonitorAlertShell
      campaign={CAMPAIGN}
      preview={`${monitorName} is currently unreachable`}
      heading='Monitor Alert'
      variant='error'
      boxTitle='Monitor Down'
      boxBody={
        <>
          <strong>{monitorName}</strong> is currently unreachable.
        </>
      }
      dashboardId={dashboardId}
      monitorId={monitorId}
      afterCta={<P className='text-sm text-slate-500'>We&apos;ll notify you again when the monitor recovers.</P>}
    >
      <MonitorUrlRow url={url} />
      <DetailRow label='Time'>{formatUtc(detectedAt)}</DetailRow>
      {statusCode !== undefined && <DetailRow label='Status Code'>{statusCode}</DetailRow>}
      <DetailRow label='Reason'>{reason}</DetailRow>
    </MonitorAlertShell>
  );
}

MonitorDownEmail.PreviewProps = {
  to: 'owner@example.com',
  monitorName: 'example.com',
  url: 'https://example.com',
  reason: 'Connection timed out',
  statusCode: 503,
  detectedAt: '2026-01-15T10:30:00Z',
  dashboardId: 'dashboard-id',
  monitorId: 'monitor-id',
} satisfies MonitorDownEmailData;

export default MonitorDownEmail;

export const createMonitorDownEmailTemplate = (data: MonitorDownEmailData) =>
  renderEmailTemplate(MonitorDownEmail, data, `Uptime Alert: Site Is Down: ${subjectText(data.monitorName)}`);
