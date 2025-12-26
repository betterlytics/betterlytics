'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDowntimeFromUptimeHours, formatPercentage } from '@/utils/formatters';
import {
  formatCompactFromMilliseconds,
  formatLocalDateTime,
  formatTimeAgo,
  formatTimeLeft,
} from '@/utils/dateFormatters';
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
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { LiveIndicator } from '@/components/live-indicator';
import { PillBar } from '../components/PillBar';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, LockOpen, LucideIcon, ShieldOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatIntervalLabel } from '../utils';
import { isHttpUrl } from '../utils';
import { cn } from '@/lib/utils';
import React from 'react';

type MonitorSummarySectionProps = {
  monitor: Pick<
    MonitorCheck,
    'isEnabled' | 'intervalSeconds' | 'timeoutMs' | 'createdAt' | 'updatedAt' | 'checkSslErrors' | 'url'
  >;
  metrics?: Pick<
    MonitorMetrics,
    | 'lastCheckAt'
    | 'backoffLevel'
    | 'effectiveIntervalSeconds'
    | 'uptime24hPercent'
    | 'incidents24h'
    | 'uptimeBuckets'
    | 'latency'
  >;
  tls?: MonitorTlsResult | null;
  operationalState: MonitorOperationalState;
};

export function MonitorSummarySection({ monitor, metrics, tls, operationalState }: MonitorSummarySectionProps) {
  const latencyAvg = metrics?.latency?.avgMs ?? null;

  return (
    <div className='grid gap-4 lg:grid-cols-2 xl:grid-cols-4'>
      <LastCheckCard
        intervalSeconds={monitor.intervalSeconds}
        lastCheckAt={metrics?.lastCheckAt ?? undefined}
        backoffLevel={metrics?.backoffLevel ?? undefined}
        effectiveIntervalSeconds={metrics?.effectiveIntervalSeconds ?? undefined}
        operationalState={operationalState}
      />
      <Last24hCard
        uptimePercent={metrics?.uptime24hPercent}
        incidents={metrics?.incidents24h ?? 0}
        buckets={metrics?.uptimeBuckets}
      />
      <ResponseTimeCard avg={latencyAvg} operationalState={operationalState} />
      <SslCard tls={tls} isDisabled={!monitor.checkSslErrors} isHttpSite={isHttpUrl(monitor.url)} />
    </div>
  );
}

function SummaryCard({
  title,
  headerRight,
  helper,
  children,
  className,
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
      className={cn(
        'border-border/70 bg-card/80 flex h-full flex-col p-4 shadow-lg shadow-black/10',
        gap,
        className,
      )}
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
  intervalSeconds,
  lastCheckAt: lastCheckAtRaw,
  backoffLevel,
  effectiveIntervalSeconds,
  operationalState,
}: {
  intervalSeconds: number;
  lastCheckAt?: string;
  backoffLevel?: number;
  effectiveIntervalSeconds?: number;
  operationalState: MonitorOperationalState;
}) {
  const t = useTranslations('monitoringDetailPage.summary.lastCheck');
  const tMonitoringPage = useTranslations('monitoringPage');
  const tList = useTranslations('monitoringPage.list');
  const tStatus = useTranslations('monitoring.status');

  const lastCheckAt = lastCheckAtRaw ? new Date(lastCheckAtRaw).getTime() : null;
  const [, tick] = useState(0);

  const isPaused = operationalState === 'paused';
  const isPreparing = operationalState === 'preparing';
  const isActive = !isPaused && !isPreparing;

  useEffect(() => {
    if (!lastCheckAt || isPaused) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [isPaused, lastCheckAt]);

  const lastCheckLabel = useMemo(() => {
    if (isPaused) return t('paused');
    if (isPreparing || !lastCheckAt) return t('preparing');
    return formatTimeAgo(new Date(lastCheckAt), true);
  }, [isPaused, isPreparing, lastCheckAt]);

  const helper = useMemo(() => {
    if (isPaused) return t('helperPaused');
    if (isPreparing) return t('helperPreparing');
    return t('helperScheduled', { seconds: intervalSeconds });
  }, [isPaused, isPreparing, intervalSeconds]);

  const isBackedOff = (backoffLevel ?? 0) > 0 && (effectiveIntervalSeconds ?? 0) > 0;

  const effectiveLabelText = isBackedOff
    ? formatIntervalLabel(tMonitoringPage, effectiveIntervalSeconds ?? intervalSeconds)
    : undefined;

  const backoffTooltipMessage = effectiveLabelText
    ? tList('backoffTooltip', { value: effectiveLabelText })
    : undefined;

  const { indicator: color } = presentMonitorStatus(operationalState);

  const statusAriaLabel = isPaused ? tStatus('monitoringPaused') : tStatus('monitoringActive');

  return (
    <SummaryCard
      title={t('title')}
      helper={helper}
      bodyClassName='flex flex-1 items-center gap-2 text-lg font-semibold sm:text-xl'
    >
      <LiveIndicator
        color={color}
        positionClassName=''
        sizeClassName='h-3 w-3'
        pulse={isActive}
        aria-label={statusAriaLabel}
      />
      <span className='text-foreground tabular-nums'>{lastCheckLabel}</span>
      {backoffTooltipMessage && (
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
    </SummaryCard>
  );
}

function ResponseTimeCard({
  avg,
  operationalState,
}: {
  avg: number | null;
  operationalState: MonitorOperationalState;
}) {
  const t = useTranslations('monitoringDetailPage.summary.responseTime');
  const tLatency = useTranslations('monitoring.latency');
  const presentation = presentLatencyStatus({ avgMs: avg, operationalState });
  const theme = presentation.theme;
  const badgeLabel = tLatency(presentation.labelKey);

  return (
    <SummaryCard
      title={t('avgResponseTime')}
      headerRight={
        <Badge variant='outline' className={cn('text-xs', presentation.badgeClass)}>
          {badgeLabel}
        </Badge>
      }
      helper={t('helper')}
      bodyClassName='flex flex-1 flex-wrap items-baseline gap-2'
    >
      <span className={cn(theme.text, 'mt-2 text-3xl font-semibold tracking-tight')}>
        {avg == null ? '—' : formatCompactFromMilliseconds(avg)}
      </span>
    </SummaryCard>
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
    <SummaryCard
      title={t('title')}
      headerRight={<p className={cn(theme.text, 'text-xs font-semibold')}>{formattedPercent}</p>}
      helper={
        incidents === 0 ? t('helperNone') : t('helperWithIncidents', { count: incidents, downtime: downtimeLabel })
      }
      gap='gap-1.5'
      bodyClassName='flex flex-1 items-center justify-center'
    >
      <PillBar data={buckets} />
    </SummaryCard>
  );
}

type SslCardProps = {
  tls: MonitorTlsResult | null | undefined;
  isDisabled: boolean;
  isHttpSite: boolean;
};

function SslCard({ tls, isDisabled, isHttpSite }: SslCardProps) {
  const t = useTranslations('monitoringDetailPage.summary.ssl');
  const tSsl = useTranslations('monitoring.ssl');
  const locale = useLocale();

  const renderStatusCard = (badgeText: string, Icon: LucideIcon, description: string, iconClass = '') => (
    <SummaryCard
      title={t('title')}
      headerRight={
        <Badge variant='outline' className='border-muted-foreground/40 text-muted-foreground text-xs'>
          {badgeText}
        </Badge>
      }
      bodyClassName='mt-3 flex flex-1 items-center justify-center'
    >
      <div className='flex flex-col items-center gap-2 py-2 text-center'>
        <Icon className={`text-muted-foreground ${iconClass}`} aria-hidden />
        <p className='text-foreground text-sm font-medium'>{description}</p>
      </div>
    </SummaryCard>
  );

  if (isHttpSite) {
    return renderStatusCard(t('notApplicable'), LockOpen, t('httpSiteDescription'), 'h-7 w-7 opacity-50');
  }

  if (isDisabled) {
    return renderStatusCard(t('disabled'), ShieldOff, t('disabledDescription'));
  }

  const expiry = tls?.tlsNotAfter ? new Date(tls.tlsNotAfter) : null;
  const daysLeft = computeDaysUntil(tls?.tlsNotAfter);
  const presentation = presentSslStatus({ status: tls?.status, daysLeft });
  const timeLeftLabel = formatTimeLeft(daysLeft);
  const expiresLabel = (expiry ? formatLocalDateTime(expiry, locale, { dateStyle: 'medium' }) : undefined) ?? '—';
  const badgeLabel = tSsl(presentation.labelKey);

  return (
    <SummaryCard
      title={t('title')}
      headerRight={
        <Badge variant='outline' className={cn('text-xs', presentation.badgeClass)}>
          {badgeLabel}
        </Badge>
      }
      bodyClassName='mt-3 flex flex-row items-start gap-2 sm:gap-2'
    >
      <presentation.icon className={cn('mt-0.5 h-6 w-6 sm:h-8 sm:w-8', presentation.theme.text)} aria-hidden />
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
    </SummaryCard>
  );
}
