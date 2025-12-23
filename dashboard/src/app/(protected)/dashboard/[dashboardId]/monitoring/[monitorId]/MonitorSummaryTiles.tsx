'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatDowntimeFromUptimeHours, formatPercentage } from '@/utils/formatters';
import { formatCompactFromMilliseconds, formatTimeAgo, formatTimeLeft } from '@/utils/dateFormatters';
import { computeDaysUntil } from '@/utils/dateHelpers';
import {
  presentLatencyStatus,
  presentMonitorStatus,
  presentUptimeTone,
  presentSslStatus,
} from '@/app/(protected)/dashboard/[dashboardId]/monitoring/monitoringStyles';
import {
  type MonitorCheck,
  type MonitorMetrics,
  type MonitorOperationalState,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import { type ReactNode, useEffect, useState } from 'react';
import { LiveIndicator } from '@/components/live-indicator';
import { PillBar } from '../components/PillBar';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatIntervalLabel } from '../utils';

type MonitorSummaryMetrics = Pick<
  MonitorMetrics,
  | 'lastCheckAt'
  | 'lastStatus'
  | 'uptime24hPercent'
  | 'incidents24h'
  | 'uptimeBuckets'
  | 'latency'
  | 'effectiveIntervalSeconds'
  | 'backoffLevel'
>;

type MonitorSummaryTilesProps = {
  monitor: Pick<
    MonitorCheck,
    'isEnabled' | 'intervalSeconds' | 'timeoutMs' | 'createdAt' | 'updatedAt' | 'checkSslErrors'
  >;
  metrics?: MonitorSummaryMetrics;
  tls?: MonitorTlsResult | null;
  operationalState: MonitorOperationalState;
};

export function MonitorSummaryTiles({ monitor, metrics, tls, operationalState }: MonitorSummaryTilesProps) {
  const t = useTranslations('monitoringDetailPage.summary');
  const latencyAvg = metrics?.latency?.avgMs ?? null;

  return (
    <div className='grid gap-4 lg:grid-cols-2 xl:grid-cols-4'>
      <LastCheckCard monitor={monitor} metrics={metrics} operationalState={operationalState} />
      <Last24hCard
        uptimePercent={metrics?.uptime24hPercent}
        incidents={metrics?.incidents24h ?? 0}
        buckets={metrics?.uptimeBuckets}
      />
      <ResponseSummaryTile title={t('avgResponseTime')} avg={latencyAvg} operationalState={operationalState} />
      <SslSummaryCard tls={tls} isDisabled={!monitor.checkSslErrors} />
    </div>
  );
}

function SummaryTile({
  title,
  headerRight,
  helper,
  children,
  className = '',
  gap = 'gap-2',
  bodyClassName = 'flex flex-1 items-center',
}: {
  title: string;
  headerRight?: ReactNode;
  helper?: ReactNode;
  children: ReactNode;
  className?: string;
  gap?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={`border-border/70 bg-card/80 flex h-full flex-col ${gap} p-4 shadow-lg shadow-black/10 ${className}`}
    >
      <div className='flex items-center justify-between gap-2'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{title}</p>
        {headerRight}
      </div>
      <div className={bodyClassName}>{children}</div>
      {helper && <div className='text-muted-foreground mt-1 text-xs sm:text-sm'>{helper}</div>}
    </Card>
  );
}

function LastCheckCard({
  monitor,
  metrics,
  operationalState,
}: {
  monitor: MonitorSummaryTilesProps['monitor'];
  metrics?: MonitorSummaryMetrics;
  operationalState: MonitorOperationalState;
}) {
  const t = useTranslations('monitoringDetailPage.summary.lastCheck');
  const tMonitoringPage = useTranslations('monitoringPage');
  const tList = useTranslations('monitoringPage.list');
  const lastCheckAt = metrics?.lastCheckAt ? new Date(metrics.lastCheckAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  const isPaused = operationalState === 'paused';
  const isPreparing = operationalState === 'preparing';

  useEffect(() => {
    if (!lastCheckAt || isPaused) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isPaused, lastCheckAt]);

  const lastCheckLabel = (() => {
    if (isPaused) return t('paused');
    if (isPreparing || !lastCheckAt) return t('preparing');
    return formatTimeAgo(new Date(lastCheckAt), true);
  })();

  const helper = (() => {
    if (isPaused) return t('helperPaused');
    if (isPreparing) return t('helperPreparing');
    return t('helperScheduled', { seconds: monitor.intervalSeconds ?? 0 });
  })();

  const isBackedOff = (metrics?.backoffLevel ?? 0) > 0 && (metrics?.effectiveIntervalSeconds ?? 0) > 0;
  const effectiveLabel = isBackedOff
    ? formatIntervalLabel(tMonitoringPage, metrics?.effectiveIntervalSeconds ?? monitor.intervalSeconds)
    : null;
  const backoffTooltipMessage = effectiveLabel ? tList('backoffTooltip', { value: effectiveLabel }) : null;

  return (
    <SummaryTile
      title={t('title')}
      helper={helper}
      bodyClassName='flex flex-1 items-center gap-2 text-lg font-semibold sm:text-xl'
    >
      <StatusDot operationalState={operationalState} />
      <span className='text-foreground tabular-nums'>{lastCheckLabel}</span>
      {isBackedOff && backoffTooltipMessage && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle
              className='mt-1 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500'
              aria-label={backoffTooltipMessage}
            />
          </TooltipTrigger>
          <TooltipContent side='top' className='max-w-[260px] break-words'>
            {backoffTooltipMessage}
          </TooltipContent>
        </Tooltip>
      )}
    </SummaryTile>
  );
}

function ResponseSummaryTile({
  title,
  avg,
  operationalState,
}: {
  title: string;
  avg: number | null;
  operationalState: MonitorOperationalState;
}) {
  const tLatency = useTranslations('monitoring.latency');
  const presentation = presentLatencyStatus({ avgMs: avg, operationalState });
  const theme = presentation.theme;
  const badgeClass = presentation.badgeClass;
  const badgeLabel = tLatency(presentation.labelKey);

  return (
    <SummaryTile
      title={title}
      headerRight={
        <Badge variant='outline' className={`text-xs ${badgeClass}`}>
          {badgeLabel}
        </Badge>
      }
      bodyClassName='flex flex-wrap items-baseline gap-2'
    >
      <span className={`${theme.text} mt-2 text-3xl font-semibold tracking-tight`}>
        {avg == null ? '—' : formatCompactFromMilliseconds(avg)}
      </span>
    </SummaryTile>
  );
}

function Last24hCard({
  uptimePercent,
  incidents,
  buckets,
}: {
  uptimePercent: number | null | undefined;
  incidents: number;
  buckets?: MonitorMetrics['uptimeBuckets'];
}) {
  const t = useTranslations('monitoringDetailPage.summary.last24h');
  const tDowntime = useTranslations('monitoringDetailPage.downtime');
  const formattedPercent =
    uptimePercent != null ? formatPercentage(uptimePercent, 2, { trimHundred: true }) : '— %';
  const downtimeLabel =
    uptimePercent != null ? formatDowntimeFromUptimeHours(uptimePercent, 24) : tDowntime('unknown');
  const { theme } = presentUptimeTone(uptimePercent);
  return (
    <SummaryTile
      title={t('title')}
      headerRight={<p className={`${theme.text} text-xs font-semibold`}>{formattedPercent}</p>}
      helper={
        incidents === 0 ? t('helperNone') : t('helperWithIncidents', { count: incidents, downtime: downtimeLabel })
      }
      gap='gap-1.5'
      bodyClassName='flex flex-1 items-center justify-center'
    >
      <PillBar data={buckets} />
    </SummaryTile>
  );
}

function StatusDot({ operationalState }: { operationalState: MonitorOperationalState }) {
  const tStatus = useTranslations('monitoring.status');
  const { indicator: color } = presentMonitorStatus(operationalState);
  const isActive = operationalState !== 'paused' && operationalState !== 'preparing';
  return (
    <span
      className='relative inline-flex h-3 w-3 align-middle'
      aria-label={operationalState === 'paused' ? tStatus('monitoringPaused') : tStatus('monitoringActive')}
    >
      <LiveIndicator color={color} positionClassName='static' sizeClassName='h-3 w-3' pulse={isActive} />
    </span>
  );
}

function SslSummaryCard({ tls, isDisabled }: { tls: MonitorTlsResult | null | undefined; isDisabled?: boolean }) {
  const t = useTranslations('monitoringDetailPage.summary.ssl');
  const tSsl = useTranslations('monitoring.ssl');
  const expiry = tls?.tlsNotAfter ? new Date(tls.tlsNotAfter) : null;
  const daysLeft = computeDaysUntil(tls?.tlsNotAfter);
  const presentation = presentSslStatus({ status: tls?.status, daysLeft });
  const timeLeftLabel = formatTimeLeft(daysLeft);
  const expiresLabel = expiry ? format(expiry, 'MM/dd/yyyy') : '—';
  const badgeLabel = tSsl(presentation.labelKey);

  return (
    <SummaryTile
      title={t('title')}
      headerRight={
        isDisabled ? (
          <Badge variant='outline' className='border-muted-foreground/30 text-muted-foreground text-xs'>
            {t('disabled')}
          </Badge>
        ) : (
          <Badge variant='outline' className={`text-xs ${presentation.badgeClass}`}>
            {badgeLabel}
          </Badge>
        )
      }
      bodyClassName='mt-3 flex flex-row items-start gap-2 sm:gap-2'
      className={isDisabled ? 'opacity-50 grayscale' : ''}
    >
      <presentation.icon className={`mt-0.5 h-6 w-6 sm:h-8 sm:w-8 ${presentation.theme.text}`} aria-hidden />
      <div className='flex flex-row items-start gap-2 sm:gap-3'>
        <p className='text-foreground text-3xl leading-tight font-semibold tracking-tight'>
          {timeLeftLabel.value}
        </p>
        <div className='flex flex-col gap-0.5 text-xs leading-tight sm:text-sm'>
          <p className='text-foreground font-semibold capitalize'>
            {timeLeftLabel.unit
              ? t('timeLeftWithUnit', { unit: timeLeftLabel.unit.toLowerCase() })
              : t('timeLeft')}
          </p>
          <p className='text-muted-foreground font-medium'>{t('expires', { date: expiresLabel })}</p>
        </div>
      </div>
    </SummaryTile>
  );
}
