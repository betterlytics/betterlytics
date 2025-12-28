'use client';

import { type Dispatch, type SetStateAction, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorResult,
} from '@/entities/analytics/monitoring.entities';
import { formatCompactFromMilliseconds, formatDuration } from '@/utils/dateFormatters';
import {
  MONITOR_TONE,
  presentCheckStatus,
  presentIncidentState,
  presentUptimeTone,
  type CheckStatusPresentation,
  type MonitorTone,
} from '@/app/(protected)/dashboard/[dashboardId]/monitoring/styles';
import { defaultDateLabelFormatter } from '@/utils/chartUtils';
import { type PresentedMonitorUptime } from '@/presenters/toMonitorUptimeDays';
import { ResponseTimeChart } from './ResponseTimeChart';
import { useLocale, useTranslations } from 'next-intl';
import { MonitoringTooltip } from './MonitoringTooltip';
import { formatPercentage, formatTimeFromNow } from '@/utils/formatters';
import { getReasonTranslationKey } from '@/lib/monitorReasonCodes';
import { cn } from '@/lib/utils';

export function ResponseTimeCard({ metrics }: { metrics?: MonitorMetrics }) {
  return (
    <ResponseTimeChart data={metrics?.latencySeries ?? []} incidentSegments={metrics?.incidentSegments24h ?? []} />
  );
}

export function IncidentsCard({ incidents }: { incidents: MonitorIncidentSegment[] }) {
  const t = useTranslations('monitoringDetailPage');
  return (
    <Card className='border-border/70 bg-card/80 flex flex-col gap-4 p-5 shadow-lg shadow-black/10 xl:col-span-2'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{t('incidents.title')}</p>
        <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
          {t('incidents.badge')}
        </Badge>
      </div>
      <CardContent className='px-0'>
        {incidents.length === 0 ? (
          <div className='border-border/60 bg-background/30 flex flex-1 flex-col items-center justify-center rounded-md border p-6 text-center'>
            <p className='text-foreground text-lg font-semibold'>{t('incidents.emptyTitle')}</p>
            <p className='text-muted-foreground mt-1 text-sm'>{t('incidents.emptyDescription')}</p>
          </div>
        ) : (
          <div className='border-border/70 overflow-x-auto rounded-md border'>
            <Table className='overflow-x-auto'>
              <TableHeader className='bg-muted/10'>
                <TableRow className='text-muted-foreground text-xs font-semibold tracking-wide'>
                  <TableHead className='w-[140px]'>{t('incidents.headers.status')}</TableHead>
                  <TableHead>{t('incidents.headers.root')}</TableHead>
                  <TableHead>{t('incidents.headers.started')}</TableHead>
                  <TableHead className='text-right'>{t('incidents.headers.duration')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((segment) => (
                  <IncidentRow
                    key={`${segment.start}-${segment.state}-${segment.reason ?? ''}`}
                    segment={segment}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentChecksCard({
  checks,
  errorsOnly,
  setErrorsOnly,
}: {
  checks: MonitorResult[];
  errorsOnly: boolean;
  setErrorsOnly: Dispatch<SetStateAction<boolean>>;
}) {
  const t = useTranslations('monitoringDetailPage');
  return (
    <Card className='border-border/70 bg-card/80 p-5 shadow-lg shadow-black/10 lg:col-span-2'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{t('recent.title')}</p>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setErrorsOnly(!errorsOnly)}
            aria-pressed={errorsOnly}
            className={cn(
              'hover:bg-primary/5 inline-flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium sm:w-auto',
              errorsOnly
                ? 'bg-primary/10 border-primary/20 text-popover-foreground disabled:opacity-50'
                : 'bg-muted/30 border-border text-muted-foreground',
            )}
          >
            <div className={cn('h-3 w-3 rounded-full border', errorsOnly && MONITOR_TONE.down.dot)} />
            <span>{t('recent.errorsOnly')}</span>
          </button>
          <Badge
            variant='secondary'
            className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'
          >
            {t('recent.badge')}
          </Badge>
        </div>
      </div>

      {checks.length === 0 ? (
        <div className='border-border/60 bg-background/30 text-muted-foreground flex items-center justify-center rounded-md border p-3 text-xs'>
          {t('recent.empty')}
        </div>
      ) : (
        <div className='border-border/70 overflow-hidden rounded-md border'>
          <Table>
            <TableHeader className='bg-muted/10'>
              <TableRow className='text-muted-foreground text-xs font-semibold tracking-wide'>
                <TableHead className='w-[160px]'>{t('recent.headers.status')}</TableHead>
                <TableHead className='w-[300px]'>{t('recent.headers.ran')}</TableHead>
                <TableHead className='w-[120px]'>{t('recent.headers.latency')}</TableHead>
                <TableHead className='w-[120px]'>{t('recent.headers.statusCode')}</TableHead>
                <TableHead className='hidden w-[200px] sm:table-cell'>{t('recent.headers.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <CheckRow key={`${check.ts}-${check.status}`} check={check} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

export function Uptime180DayCard({ uptime, title }: { title?: string; uptime?: PresentedMonitorUptime }) {
  const t = useTranslations('monitoringDetailPage');
  const tLabels = useTranslations('monitoring.labels');
  const locale = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalDays = uptime?.totalDays ?? 180;
  const grid = uptime?.grid ?? [];
  const stats = uptime?.stats ?? [];
  const resolvedTitle = title ?? t('uptime.title');

  // Scroll to the right on mount so the latest days are visible
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [grid.length]);

  const getTone = (upRatio: number | null): MonitorTone | null => {
    if (upRatio === null) return null;
    if (upRatio >= 0.99) return 'ok';
    if (upRatio >= 0.95) return 'warn';
    return 'down';
  };

  const getLabel = (upRatio: number | null) => {
    if (upRatio !== null) {
      return t('uptime.grid.uptimeLabel', {
        value: formatPercentage(upRatio * 100, 2, { trimHundred: true }),
      });
    }
    return tLabels('noData');
  };

  return (
    <Card className='border-border/70 bg-card/80 p-5 shadow-lg shadow-black/10'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{resolvedTitle}</p>
        <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
          {t('uptime.badge', { days: totalDays })}
        </Badge>
      </div>
      <div className='space-y-4'>
        <div ref={scrollContainerRef} className='overflow-x-auto'>
          <div className='grid auto-cols-[14px] grid-flow-col auto-rows-[14px] grid-rows-7 justify-start gap-[3px]'>
            {grid.map((cell) => {
              const date = new Date(cell.date);
              const tone = getTone(cell.upRatio);
              const toneClass = tone ? MONITOR_TONE[tone].solid : 'bg-border/40';
              const displayDate = defaultDateLabelFormatter(date.getTime(), 'day', locale);
              const label = getLabel(cell.upRatio);
              return (
                <MonitoringTooltip key={cell.key} title={displayDate} description={label}>
                  <span
                    className={`hover:ring-primary/60 h-[14px] w-[14px] rounded-[3px] ${toneClass} transition ring-inset hover:ring-1`}
                    aria-label={`${displayDate} · ${label}`}
                  />
                </MonitoringTooltip>
              );
            })}
          </div>
        </div>

        <div className='grid grid-cols-1 gap-2 text-xs sm:text-sm 2xl:grid-cols-2'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='border-border/60 flex items-center justify-between rounded-md border px-3 py-2'
            >
              <span className='text-muted-foreground font-semibold tracking-wide'>
                {t('uptime.stats.label', { days: stat.windowDays })}
              </span>
              <div className='text-right'>
                <div className={presentUptimeTone(stat.percent).theme.text}>
                  {stat.percent != null ? formatPercentage(stat.percent, 2) : '— %'}
                </div>
                <div className='text-muted-foreground text-xs'>
                  {stat.downtime ?? t('uptime.stats.downFallback')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function IncidentRow({ segment }: { segment: MonitorIncidentSegment }) {
  const t = useTranslations('monitoring.incidentStatus');
  const tReason = useTranslations('monitor.reason');
  const start = new Date(segment.start);
  const duration = segment.durationMs ? formatDuration(Math.floor(segment.durationMs / 1000)) : '—';
  const presentation = presentIncidentState(segment.state);
  const label = t(presentation.labelKey);
  const reasonKey = getReasonTranslationKey(segment.reason);
  const locale = useLocale();
  return (
    <TableRow className='text-sm'>
      <TableCell>
        <div className='flex items-center gap-2'>
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${presentation.theme.dot}`} aria-label={label} />
          <span className='text-foreground font-semibold capitalize'>{label}</span>
        </div>
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>{tReason(reasonKey)}</TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>
        {formatTimeFromNow(start, locale)}
      </TableCell>
      <TableCell className='text-muted-foreground text-right text-xs sm:text-sm'>{duration}</TableCell>
    </TableRow>
  );
}

function CheckRow({ check }: { check: MonitorResult }) {
  const t = useTranslations('monitoring.checkStatus');
  const tReason = useTranslations('monitor.reason');
  const timestamp = new Date(check.ts);
  const presentation = presentCheckStatus(check.status);
  const label = t(presentation.labelKey);
  const reasonKey = getReasonTranslationKey(check.reasonCode);
  const locale = useLocale();
  return (
    <TableRow className='text-sm'>
      <TableCell>
        <div className='flex items-center gap-2'>
          <CheckStatusDot presentation={presentation} label={label} />
          <span className='text-foreground font-semibold capitalize'>{label}</span>
        </div>
      </TableCell>
      <TableCell className='text-muted-foreground w-[150px] text-xs whitespace-nowrap sm:text-sm'>
        {formatTimeFromNow(timestamp, locale)}
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>
        <span className='text-foreground font-semibold'>{formatCompactFromMilliseconds(check.latencyMs)}</span>
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>{check.statusCode ?? '—'}</TableCell>
      <TableCell className='text-muted-foreground hidden text-xs sm:table-cell sm:text-sm'>
        {tReason(reasonKey)}
      </TableCell>
    </TableRow>
  );
}

function CheckStatusDot({ presentation, label }: { presentation: CheckStatusPresentation; label: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${presentation.theme.dot}`} aria-label={label} />;
}
