'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDowntimeFromUptimeHours, formatPercentage } from '@/utils/formatters';
import {
  formatCompactFromMilliseconds,
  formatLocalDateTime,
  formatTimeLeft,
  formatElapsedTime,
} from '@/utils/dateFormatters';
import { computeDaysUntil } from '@/utils/dateHelpers';
import {
  presentLatencyStatus,
  presentMonitorStatus,
  presentUptimeTone,
  presentSslStatus,
} from '@/app/(protected)/dashboard/[dashboardId]/monitoring/styles';
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
import { AlertCircle, ArrowRight, LockOpen, RefreshCcw, Shield } from 'lucide-react';
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
    | 'currentStateSince'
  >;
  tls?: MonitorTlsResult | null;
  operationalState: MonitorOperationalState;
  onEnableSslClick?: () => void;
  onCountdownExpired?: () => void;
};

export function MonitorSummarySection({
  monitor,
  metrics,
  tls,
  operationalState,
  onEnableSslClick,
  onCountdownExpired,
}: MonitorSummarySectionProps) {
  const latencyAvg = metrics?.latency?.avgMs ?? null;

  return (
    <div className='grid gap-4 lg:grid-cols-2 xl:grid-cols-4'>
      <NextCheckCard
        intervalSeconds={monitor.intervalSeconds}
        lastCheckAt={metrics?.lastCheckAt ?? undefined}
        backoffLevel={metrics?.backoffLevel ?? undefined}
        effectiveIntervalSeconds={metrics?.effectiveIntervalSeconds ?? undefined}
        operationalState={operationalState}
        onCountdownExpired={onCountdownExpired}
        currentStateSince={metrics?.currentStateSince ?? undefined}
      />
      <Last24hCard
        uptimePercent={metrics?.uptime24hPercent}
        incidents={metrics?.incidents24h ?? 0}
        buckets={metrics?.uptimeBuckets}
      />
      <ResponseTimeCard avg={latencyAvg} operationalState={operationalState} />
      <SslCard
        tls={tls}
        isDisabled={!monitor.checkSslErrors}
        isHttpSite={isHttpUrl(monitor.url)}
        onEnableClick={onEnableSslClick}
      />
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

function NextCheckCard({
  intervalSeconds,
  lastCheckAt: lastCheckAtRaw,
  backoffLevel,
  effectiveIntervalSeconds,
  operationalState,
  onCountdownExpired,
  currentStateSince,
}: {
  intervalSeconds: number;
  lastCheckAt?: string;
  backoffLevel?: number;
  effectiveIntervalSeconds?: number;
  operationalState: MonitorOperationalState;
  onCountdownExpired?: () => void;
  currentStateSince?: string;
}) {
  const t = useTranslations('monitoringDetailPage.summary.nextCheck');
  const tMonitoringPage = useTranslations('monitoringPage');
  const tList = useTranslations('monitoringPage.list');
  const tStatus = useTranslations('monitoring.status');

  const lastCheckAt = lastCheckAtRaw ? new Date(lastCheckAtRaw).getTime() : null;
  const [now, setNow] = useState(Date.now);

  const isPaused = operationalState === 'paused';
  const isPreparing = operationalState === 'preparing';
  const isActive = !isPaused && !isPreparing;

  const activeInterval = effectiveIntervalSeconds ?? intervalSeconds;

  const firedForCheckRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!lastCheckAt || isPaused) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isPaused, lastCheckAt]);

  const { label: countdownLabel, isAwaiting } = useMemo(() => {
    if (isPaused) return { label: t('paused'), isAwaiting: false };
    if (isPreparing || !lastCheckAt) return { label: t('preparing'), isAwaiting: false };

    const secondsSinceLastCheck = Math.floor((now - lastCheckAt) / 1000);
    const countdown = activeInterval - secondsSinceLastCheck;

    if (countdown <= 0) {
      return { label: t('awaiting'), isAwaiting: true };
    }

    return { label: t('inSeconds', { seconds: countdown }), isAwaiting: false };
  }, [isPaused, isPreparing, lastCheckAt, now, activeInterval, t]);

  useEffect(() => {
    if (isAwaiting && lastCheckAt && firedForCheckRef.current !== lastCheckAt) {
      firedForCheckRef.current = lastCheckAt;
      onCountdownExpired?.();
    }
  }, [isAwaiting, lastCheckAt, onCountdownExpired]);

  const helper = useMemo(() => {
    if (isPaused) return t('helperPaused');
    if (isPreparing) return t('helperPreparing');
    if (currentStateSince) {
      const duration = formatElapsedTime(new Date(currentStateSince));
      return operationalState === 'down' ? t('helperDownFor', { duration }) : t('helperUpFor', { duration });
    }
    return null;
  }, [isPaused, isPreparing, currentStateSince, operationalState, t]);

  const isBackedOff = (backoffLevel ?? 0) > 0 && (effectiveIntervalSeconds ?? 0) > 0;

  const effectiveLabelText = isBackedOff
    ? formatIntervalLabel(tMonitoringPage, effectiveIntervalSeconds ?? intervalSeconds)
    : undefined;

  const backoffTooltipMessage = effectiveLabelText
    ? tList('backoffTooltip', { value: effectiveLabelText })
    : undefined;

  const { indicator: color } = presentMonitorStatus(operationalState);

  const statusAriaLabel = isPaused ? tStatus('monitoringPaused') : tStatus('monitoringActive');

  const intervalLabel = formatIntervalLabel(tMonitoringPage, intervalSeconds);

  return (
    <SummaryCard
      title={t('title')}
      headerRight={
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant='outline'
              className='text-muted-foreground border-muted-foreground/40 inline-flex items-center gap-1 text-xs'
            >
              <RefreshCcw size={12} aria-hidden />
              {intervalLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side='top' className='max-w-[260px] break-words'>
            {t('helperScheduled', { seconds: intervalSeconds })}
          </TooltipContent>
        </Tooltip>
      }
      helper={helper}
      bodyClassName='flex flex-1 items-center gap-2 text-lg font-semibold sm:text-xl'
    >
      <LiveIndicator
        color={color}
        positionClassName=''
        sizeClassName='h-3 w-3'
        pulse={isActive || isAwaiting}
        aria-label={statusAriaLabel}
      />
      <span className='text-foreground tabular-nums'>{countdownLabel}</span>
      {backoffTooltipMessage && !isPaused && (
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
  onEnableClick?: () => void;
};

function SslCard({ tls, isDisabled, isHttpSite, onEnableClick }: SslCardProps) {
  const t = useTranslations('monitoringDetailPage.summary.ssl');
  const tSsl = useTranslations('monitoring.ssl');
  const locale = useLocale();

  if (isHttpSite) {
    return (
      <SummaryCard
        title={t('title')}
        headerRight={
          <Badge variant='outline' className='border-muted-foreground/40 text-muted-foreground text-xs'>
            {t('notApplicable')}
          </Badge>
        }
        bodyClassName='mt-3 flex flex-1 items-center justify-center'
      >
        <div className='flex flex-col items-center gap-2 py-2 text-center'>
          <LockOpen className='text-muted-foreground h-7 w-7 opacity-50' aria-hidden />
          <p className='text-foreground text-sm font-medium'>{t('httpSiteDescription')}</p>
        </div>
      </SummaryCard>
    );
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
        <Badge
          variant='outline'
          className={cn(
            'text-xs',
            isDisabled ? 'border-muted-foreground/40 text-muted-foreground' : presentation.badgeClass,
          )}
        >
          {isDisabled ? t('disabled') : badgeLabel}
        </Badge>
      }
      className='relative overflow-hidden'
      bodyClassName='mt-3 flex flex-1 flex-row items-start gap-2 sm:gap-2'
    >
      <presentation.icon className={cn('mt-0.5 h-6 w-6 sm:h-8 sm:w-8', presentation.theme.text)} aria-hidden />
      <div className='flex flex-row items-start gap-2 sm:gap-3'>
        <p className='text-foreground text-3xl leading-tight font-semibold tracking-tight'>
          {timeLeftLabel.value}
        </p>
        {!isDisabled && (
          <div className='flex flex-col gap-0.5 text-xs leading-tight sm:text-sm'>
            <p className='text-foreground font-semibold capitalize'>
              {timeLeftLabel.unit
                ? t('timeLeftWithUnit', { unit: timeLeftLabel.unit.toLowerCase() })
                : t('timeLeft')}
            </p>
            <p className='text-muted-foreground font-medium'>{t('expires', { date: expiresLabel })}</p>
          </div>
        )}
      </div>

      {isDisabled && (
        <div className='bg-card/60 absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 backdrop-blur-[2px]'>
          <div className='bg-muted rounded-full p-0'>
            <Shield className='text-muted-foreground h-5 w-5' aria-hidden />
          </div>
          <p className='text-foreground text-sm font-medium'>{t('disabledDescription')}</p>
          {onEnableClick && (
            <Button variant='link' size='sm' onClick={onEnableClick} className='h-auto cursor-pointer p-0 text-xs'>
              {t('enableInSettings')}
              <ArrowRight className='h-3 w-3' aria-hidden />
            </Button>
          )}
        </div>
      )}
    </SummaryCard>
  );
}
