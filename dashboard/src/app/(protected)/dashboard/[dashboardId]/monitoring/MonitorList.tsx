'use client';

import { Activity, AlertTriangle, Link2, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { useTranslations } from 'next-intl';
import { formatIntervalLabel, formatSslTimeRemaining, safeHostname } from './utils';
import { computeDaysUntil } from '@/utils/dateHelpers';
import { formatElapsedTime } from '@/utils/dateFormatters';
import { type MonitorUptimeBucket, type MonitorWithStatus } from '@/entities/analytics/monitoring.entities';
import {
  presentMonitorStatus,
  presentUptimeTone,
  presentSslStatus as presentSslStatusPresentation,
  SslPresentation,
} from '@/app/(protected)/dashboard/[dashboardId]/monitoring/styles';
import { formatPercentage } from '@/utils/formatters';
import { LiveIndicator } from '@/components/live-indicator';
import { Description } from '@/components/text';
import { PillBar } from './components/PillBar';
import { MonitorStatusBadge } from './components/MonitorStatusBadge';
import { MonitorActionMenu } from './components/MonitorActionMenu';

type MonitorListProps = {
  monitors: MonitorWithStatus[];
};

export function MonitorList({ monitors }: MonitorListProps) {
  const t = useTranslations('monitoringPage');
  const tMonitoringLabels = useTranslations('monitoring.labels');
  const tSsl = useTranslations('monitoring.ssl');

  if (!monitors.length) {
    return (
      <Card variant='empty'>
        <div className='mx-auto max-w-md space-y-3'>
          <div className='bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
            <Activity className='text-muted-foreground h-6 w-6' />
          </div>
          <h3 className='text-lg font-semibold'>{t('list.emptyTitle')}</h3>
          <Description>{t('list.emptyDescription')}</Description>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-3'>
      {monitors.map((monitor) => {
        const statusPresentation = presentMonitorStatus(monitor.operationalState);
        const displayName = (monitor.name || '').trim() || safeHostname(monitor.url);

        const daysLeft = computeDaysUntil(monitor.tls?.tlsNotAfter);
        const sslPresentation = presentSslStatusPresentation({
          status: monitor.tls?.status,
          daysLeft,
          reasonCode: monitor.tls?.reasonCode,
        });
        const sslBadgeLabel = tSsl(sslPresentation.badgeLabelKey);
        const sslTimeRemaining = formatSslTimeRemaining(monitor.tls?.tlsNotAfter);
        const sslTooltipLabel =
          sslTimeRemaining != null
            ? tMonitoringLabels(sslTimeRemaining.unit === 'hours' ? 'hoursLeftFull' : 'daysLeftFull', {
                count: sslTimeRemaining.value,
              })
            : null;

        const hasData = Boolean(monitor.uptimeBuckets && monitor.uptimeBuckets.length > 0);
        const uptimePercent = hasData ? calculateUptimePercent(monitor.uptimeBuckets ?? []) : null;
        const percentLabel =
          uptimePercent != null ? formatPercentage(uptimePercent, 2, { trimHundred: true }) : '— %';
        const { theme } = presentUptimeTone(uptimePercent ?? null);

        const isBackedOff = (monitor.backoffLevel ?? 0) > 0 && (monitor.effectiveIntervalSeconds ?? 0) > 0;
        const effectiveLabel = formatIntervalLabel(t, monitor.effectiveIntervalSeconds ?? monitor.intervalSeconds);

        return (
          <FilterPreservingLink key={monitor.id} href={`monitoring/${monitor.id}`} className='block'>
            <Card className='border-border/70 bg-card/80 hover:border-border hover:bg-card group focus-visible:ring-primary/40 focus-visible:ring-offset-background relative cursor-pointer overflow-hidden py-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:py-3'>
              <div
                className={`absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b ${statusPresentation.gradient}`}
                aria-hidden
              />

              {/* Mobile layout */}
              <div className='flex items-center gap-3 px-4 py-2 md:hidden'>
                <LiveIndicator
                  color={statusPresentation.indicator}
                  positionClassName='relative'
                  sizeClassName='h-2.5 w-2.5'
                  pulse={monitor.operationalState !== 'paused'}
                />
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <span className='truncate text-sm font-semibold'>{displayName}</span>
                  <span className='text-muted-foreground text-xs'>
                    {getStatusDurationText({
                      currentStateSince: monitor.currentStateSince,
                      isUp: statusPresentation.label === 'Up',
                      t,
                    }) || (!hasData ? t('list.noData') : '')}
                  </span>
                </div>
                <div className='flex items-center' onClick={(e) => e.stopPropagation()}>
                  <MonitorActionMenu monitor={monitor} dashboardId={monitor.dashboardId} />
                </div>
              </div>

              {/* Desktop layout */}
              <div className='hidden w-full px-5 py-1.5 text-left md:grid md:grid-cols-[minmax(220px,1.5fr)_1fr] md:items-center md:gap-4'>
                <div className='flex items-start gap-2'>
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 text-sm leading-tight font-semibold'>
                        <MonitorStatusBadge presentation={statusPresentation} />
                        <span className='truncate'>{displayName}</span>
                      </div>
                    </div>
                    <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs'>
                      <span className='inline-flex items-center gap-1'>
                        <Link2 size={14} />
                        <span className='max-w-[240px] truncate'>{monitor.url}</span>
                      </span>
                      {monitor.currentStateSince && (
                        <span className='text-muted-foreground/70'>
                          |{' '}
                          {getStatusDurationText({
                            currentStateSince: monitor.currentStateSince,
                            isUp: statusPresentation.label === 'Up',
                            t,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-[120px_minmax(180px,240px)_48px] items-center gap-4 xl:grid-cols-[120px_minmax(180px,240px)_minmax(250px,1fr)_max-content_48px]'>
                  <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold whitespace-nowrap'>
                    <span className='flex items-center gap-1'>
                      <RefreshCcw size={14} aria-hidden />
                      <span>{formatIntervalLabel(t, monitor.intervalSeconds)}</span>
                    </span>
                    {isBackedOff && (
                      <BackoffBadge
                        label={effectiveLabel}
                        message={t('list.backoffTooltip', { value: effectiveLabel })}
                      />
                    )}
                  </div>
                  <div className='min-w-[180px]'>
                    <SslStatusPill
                      presentation={sslPresentation}
                      label={sslBadgeLabel}
                      tooltipLabel={sslTooltipLabel}
                    />
                  </div>
                  <div className='hidden min-w-0 xl:block'>
                    {hasData ? (
                      <PillBar data={monitor.uptimeBuckets} />
                    ) : (
                      <p className='text-muted-foreground text-xs font-medium'>{t('list.noData')}</p>
                    )}
                  </div>
                  <span className={`hidden text-xs font-semibold whitespace-nowrap xl:inline ${theme.text}`}>
                    {percentLabel}
                  </span>
                  <div className='flex items-center justify-center' onClick={(e) => e.stopPropagation()}>
                    <MonitorActionMenu monitor={monitor} dashboardId={monitor.dashboardId} />
                  </div>
                </div>
              </div>
            </Card>
          </FilterPreservingLink>
        );
      })}
    </div>
  );
}

function SslStatusPill({
  presentation,
  label,
  tooltipLabel,
}: {
  presentation: SslPresentation;
  label: string;
  tooltipLabel: string | null;
}) {
  const badge = (
    <Badge
      variant='outline'
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide whitespace-nowrap ${presentation.badgeClass}`}
    >
      <presentation.icon size={14} aria-hidden />
      <span>{label}</span>
    </Badge>
  );

  if (!tooltipLabel) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side='top'>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

function calculateUptimePercent(buckets: MonitorUptimeBucket[]): number | null {
  const valid = buckets.filter((b) => b.upRatio != null);
  if (valid.length === 0) return null;
  const avg = valid.reduce((sum, b) => sum + (b.upRatio ?? 0), 0) / valid.length;
  return avg * 100;
}

function BackoffBadge({ label, message }: { label: string; message: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant='outline'
          className='inline-flex items-center gap-1 border-amber-500/60 bg-amber-500/10 px-2 py-[3px] text-xs font-semibold text-amber-700'
        >
          <AlertTriangle size={12} aria-hidden />
          <span>{label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-[260px] break-words'>
        {message}
      </TooltipContent>
    </Tooltip>
  );
}

type StatusDurationTextParams = {
  currentStateSince: string | null | undefined;
  isUp: boolean;
  t: ReturnType<typeof useTranslations<'monitoringPage'>>;
};

function getStatusDurationText({ currentStateSince, isUp, t }: StatusDurationTextParams): string {
  if (!currentStateSince) return '';
  const prefix = isUp ? t('list.upPrefix') : t('list.downPrefix');
  return `${prefix} ${formatElapsedTime(new Date(currentStateSince))}`;
}
