'use client';

import Link from 'next/link';
import { Activity, AlertTriangle, ChevronRight, Link2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { formatIntervalLabel } from './utils';
import { type MonitorUptimeBucket, type MonitorWithStatus } from '@/entities/analytics/monitoring.entities';
import {
  presentMonitorStatus,
  presentUptimeTone,
  presentSslStatus as presentSslStatusPresentation,
  SslPresentation,
} from '@/app/(protected)/dashboard/[dashboardId]/monitoring/monitoringStyles';
import { formatPercentage } from '@/utils/formatters';
import { PillBar } from './components/PillBar';
import { MonitorStatusBadge } from './components/MonitorStatusBadge';
import { Label } from '@/components/ui/label';

type MonitorListProps = {
  monitors: MonitorWithStatus[];
};

export function MonitorList({ monitors }: MonitorListProps) {
  const t = useTranslations('monitoringPage');
  const tMonitoringLabels = useTranslations('monitoring.labels');
  const tSsl = useTranslations('monitoring.ssl');

  if (!monitors.length) {
    return (
      <Card className='border-border/50 bg-card/80 px-6 py-10 text-center'>
        <div className='mx-auto max-w-md space-y-3'>
          <div className='bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
            <Activity className='text-muted-foreground h-6 w-6' />
          </div>
          <h3 className='text-lg font-semibold'>{t('table.emptyTitle')}</h3>
          <p className='text-muted-foreground text-sm'>{t('table.emptyDescription')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-3'>
      {monitors.map((monitor) => {
        const statusPresentation = presentMonitorStatus(monitor.operationalState);

        const sslPresentation = presentSslStatusPresentation({
          status: monitor.tls?.status,
          daysLeft: monitor.tls?.tlsDaysLeft,
        });
        const sslBadgeLabel = tSsl(sslBadgeKey(sslPresentation.category));

        const hasData = Boolean(monitor.uptimeBuckets && monitor.uptimeBuckets.length > 0);
        const uptimePercent = hasData ? calculateUptimePercent(monitor.uptimeBuckets ?? []) : null;
        const percentLabel =
          uptimePercent != null ? formatPercentage(uptimePercent, 2, { trimHundred: true }) : '— %';
        const { theme } = presentUptimeTone(uptimePercent ?? null);

        const isBackedOff = (monitor.backoffLevel ?? 0) > 0 && (monitor.effectiveIntervalSeconds ?? 0) > 0;
        const effectiveLabel = formatIntervalLabel(t, monitor.effectiveIntervalSeconds ?? monitor.intervalSeconds);

        return (
          <Link
            key={monitor.id}
            href={`/dashboard/${monitor.dashboardId}/monitoring/${monitor.id}`}
            className='group focus-visible:ring-primary/40 focus-visible:ring-offset-background block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          >
            <Card className='border-border/70 bg-card/80 hover:border-border/90 hover:bg-card/90 relative overflow-hidden transition'>
              <div
                className={`absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b ${statusPresentation.gradient}`}
                aria-hidden
              />

              <div className='flex w-full flex-col gap-1 px-5 py-1.5 text-left md:grid md:grid-cols-[minmax(220px,1.5fr)_minmax(280px,1.2fr)_auto] md:items-center md:gap-1.5'>
                <div className='flex items-start gap-2'>
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 text-sm leading-tight font-semibold'>
                        <Label className='truncate'>{monitor.name || monitor.url}</Label>
                      </div>
                      <MonitorStatusBadge presentation={statusPresentation} />
                    </div>
                    <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs'>
                      <Label className='inline-flex items-center gap-1'>
                        <Link2 size={14} />
                        <Label className='max-w-[240px] truncate'>{monitor.url}</Label>
                      </Label>
                    </div>
                    <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs md:hidden'>
                      <RefreshCcw size={14} aria-hidden />
                      <Label>{formatIntervalLabel(t, monitor.intervalSeconds)}</Label>
                      {isBackedOff ? (
                        <BackoffBadge
                          label={effectiveLabel}
                          message={t('list.backoffTooltip', { value: effectiveLabel })}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className='hidden md:grid md:w-full md:grid-cols-[120px_minmax(220px,280px)_minmax(220px,1fr)_max-content] md:items-center md:gap-4'>
                  <div className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold whitespace-nowrap'>
                    <Label className='flex items-center gap-1'>
                      <RefreshCcw size={14} aria-hidden />
                      <Label>{formatIntervalLabel(t, monitor.intervalSeconds)}</Label>
                    </Label>
                    {isBackedOff ? (
                      <BackoffBadge
                        label={effectiveLabel}
                        message={t('list.backoffTooltip', { value: effectiveLabel })}
                      />
                    ) : null}
                  </div>
                  <div className='min-w-[200px]'>
                    <SslStatusPill
                      presentation={sslPresentation}
                      label={sslBadgeLabel}
                      daysLeftLabel={
                        monitor.tls?.tlsDaysLeft != null
                          ? tMonitoringLabels('daysLeft', { count: monitor.tls.tlsDaysLeft })
                          : null
                      }
                    />
                  </div>
                  <div className='min-w-0'>
                    {hasData ? (
                      <PillBar data={monitor.uptimeBuckets} />
                    ) : (
                      <p className='text-muted-foreground text-xs font-medium'>{t('list.noData')}</p>
                    )}
                  </div>
                  <Label className={`pt-1 text-[11px] font-semibold whitespace-nowrap ${theme.text}`}>
                    {percentLabel}
                  </Label>
                </div>
                <div className='flex items-center justify-end gap-2 md:justify-center md:pl-8'>
                  <Button
                    asChild
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground group-hover:text-primary bg-muted/40 ring-border/50 h-8 w-8 cursor-pointer rounded-full border border-transparent ring-1 transition-colors'
                    aria-hidden
                  >
                    <Label className='flex h-full w-full items-center justify-center'>
                      <ChevronRight className='h-4 w-4' />
                    </Label>
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function SslStatusPill({
  presentation,
  label,
  daysLeftLabel,
}: {
  presentation: SslPresentation;
  label: string;
  daysLeftLabel: string | null;
}) {
  return (
    <Badge
      variant='outline'
      className={`inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${presentation.badgeClass}`}
    >
      <presentation.icon size={14} aria-hidden />
      <Label className='text-left leading-tight break-words'>{label}</Label>
      {daysLeftLabel ? (
        <Label className='text-muted-foreground/80 text-[10px] font-medium'>{daysLeftLabel}</Label>
      ) : null}
    </Badge>
  );
}

function calculateUptimePercent(buckets: MonitorUptimeBucket[]): number | null {
  const valid = buckets.filter((b) => b.upRatio != null);
  if (valid.length === 0) return null;
  const avg = valid.reduce((sum, b) => sum + (b.upRatio ?? 0), 0) / valid.length;
  return avg * 100;
}

function sslBadgeKey(category: SslPresentation['category']) {
  switch (category) {
    case 'ok':
      return 'badgeValid';
    case 'warn':
      return 'badgeExpiringSoon';
    case 'down':
      return 'badgeExpired';
    case 'error':
      return 'badgeError';
    default:
      return 'badgeNotChecked';
  }
}

function BackoffBadge({ label, message }: { label: string; message: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant='outline'
          className='inline-flex items-center gap-1 border-amber-500/60 bg-amber-500/10 px-2 py-[3px] text-[10px] font-semibold text-amber-700'
        >
          <AlertTriangle size={12} aria-hidden />
          <Label>{label}</Label>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-[260px] break-words'>
        {message}
      </TooltipContent>
    </Tooltip>
  );
}
