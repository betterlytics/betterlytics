'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorResult,
} from '@/entities/analytics/monitoring.entities';
import { formatDistanceToNow } from 'date-fns';
import { formatCompactFromMilliseconds, formatDuration } from '@/utils/dateFormatters';
import {
  MONITOR_TONE,
  presentMonitorStatus,
  presentUptimeTone,
  type MonitorPresentation,
  type MonitorTone,
} from '@/utils/monitoringStyles';
import { defaultDateLabelFormatter } from '@/utils/chartUtils';
import { type PresentedMonitorUptime } from '@/presenters/toMonitorUptimeDays';
import { ResponseTimeChart } from './ResponseTimeChart';
import { useLocale, useTranslations } from 'next-intl';
import { MonitoringTooltip } from './MonitoringTooltip';
import { formatPercentage } from '@/utils/formatters';

export function ResponseTimeCard({ metrics }: { metrics?: MonitorMetrics }) {
  return <ResponseTimeChart data={metrics?.latencySeries ?? []} />;
}

export function IncidentsCard({ incidents }: { incidents: MonitorIncidentSegment[] }) {
  const t = useTranslations('monitoringDetailPage');
  return (
    <Card className='border-border/70 bg-card/80 gap-4 p-5 shadow-lg shadow-black/10 lg:col-span-2 xl:col-span-2'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{t('incidents.title')}</p>
        <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
          {t('incidents.badge')}
        </Badge>
      </div>

      {incidents.length === 0 ? (
        <div className='border-border/60 bg-background/30 mt-4 rounded-md border border-dashed p-6 text-center'>
          <p className='text-foreground text-lg font-semibold'>{t('incidents.emptyTitle')}</p>
          <p className='text-muted-foreground mt-1 text-sm'>{t('incidents.emptyDescription')}</p>
        </div>
      ) : (
        <div className='border-border/70 overflow-hidden rounded-md border'>
          <Table>
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
                  key={`${segment.start}-${segment.status}-${segment.reason ?? ''}`}
                  segment={segment}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

export function RecentChecksCard({ checks }: { checks: MonitorResult[] }) {
  const t = useTranslations('monitoringDetailPage');
  return (
    <Card className='border-border/70 bg-card/80 p-5 shadow-lg shadow-black/10 lg:col-span-2'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{t('recent.title')}</p>
        <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
          {t('recent.badge')}
        </Badge>
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
  const labels = useTranslations('monitoring.labels');
  const locale = useLocale();
  const totalDays = uptime?.totalDays ?? 180;
  const grid = uptime?.grid ?? [];
  const stats = uptime?.stats ?? [];
  const resolvedTitle = title ?? t('uptime.title');

  return (
    <Card className='border-border/70 bg-card/80 p-5 shadow-lg shadow-black/10'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{resolvedTitle}</p>
        <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
          {t('uptime.badge', { days: totalDays })}
        </Badge>
      </div>
      <div className='space-y-4'>
        <div className='overflow-x-auto'>
          <div className='grid auto-cols-[14px] grid-flow-col auto-rows-[14px] grid-rows-7 justify-start gap-[3px]'>
            {grid.map((cell) => {
              const date = new Date(cell.date);
              const tone: MonitorTone | null =
                cell.upRatio == null ? null : cell.upRatio >= 0.99 ? 'ok' : cell.upRatio >= 0.95 ? 'warn' : 'down';
              const toneClass = tone ? MONITOR_TONE[tone].solid : 'bg-border/40';
              const displayDate = defaultDateLabelFormatter(date.getTime(), 'day', locale);
              const label =
                cell.upRatio != null
                  ? t('uptime.grid.uptimeLabel', {
                      value: formatPercentage(cell.upRatio * 100, 2, { trimHundred: true }),
                    })
                  : labels('noData');
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

        <div className='grid gap-2 text-xs sm:grid-cols-2 sm:text-sm'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='border-border/60 flex items-center justify-between rounded-md border px-3 py-2'
            >
              <span className='text-muted-foreground font-semibold tracking-wide'>
                {stat.label ?? t('uptime.stats.label', { days: totalDays })}
              </span>
              <div className='text-right'>
                <div className={uptimeToneClass(stat.percent)}>
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
  const t = useTranslations('monitoringDetailPage');
  const misc = useTranslations('misc');
  const tStatus = useTranslations('monitoring.status');
  const start = new Date(segment.start);
  const duration = segment.durationMs ? formatDuration(Math.floor(segment.durationMs / 1000)) : '—';
  const presentation = presentMonitorStatus({ isEnabled: true, status: segment.status });
  const label = tStatus(presentation.labelKey);
  return (
    <TableRow className='text-sm'>
      <TableCell>
        <div className='flex items-center gap-2'>
          <StatusBadge presentation={presentation} label={label} />
          <span className='text-foreground font-semibold capitalize'>{label}</span>
        </div>
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>
        {segment.reason ?? misc('unknown')}
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>
        {formatDistanceToNow(start, { addSuffix: true })}
      </TableCell>
      <TableCell className='text-muted-foreground text-right text-xs sm:text-sm'>{duration}</TableCell>
    </TableRow>
  );
}

function CheckRow({ check }: { check: MonitorResult }) {
  const t = useTranslations('monitoringDetailPage');
  const misc = useTranslations('misc');
  const tStatus = useTranslations('monitoring.status');
  const timestamp = new Date(check.ts);
  const presentation = presentMonitorStatus({ isEnabled: true, status: check.status });
  const label = tStatus(presentation.labelKey);
  return (
    <TableRow className='text-sm'>
      <TableCell>
        <div className='flex items-center gap-2'>
          <StatusBadge presentation={presentation} label={label} />
          <span className='text-foreground font-semibold capitalize'>{label}</span>
        </div>
      </TableCell>
      <TableCell className='text-muted-foreground w-[150px] text-xs whitespace-nowrap sm:text-sm'>
        {formatDistanceToNow(timestamp, { addSuffix: true })}
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>
        <span className='text-foreground font-semibold'>
          {check.latencyMs == null ? '—' : formatCompactFromMilliseconds(check.latencyMs)}
        </span>
      </TableCell>
      <TableCell className='text-muted-foreground text-xs sm:text-sm'>{check.statusCode ?? '—'}</TableCell>
      <TableCell className='text-muted-foreground hidden text-xs sm:table-cell sm:text-sm'>
        {check.reasonCode ?? misc('unknown')}
      </TableCell>
    </TableRow>
  );
}

function StatusBadge({ presentation, label }: { presentation: MonitorPresentation; label: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${presentation.theme.dot}`} aria-label={label} />;
}

function uptimeToneClass(percent: number | null) {
  if (percent == null) return 'text-foreground text-sm font-semibold';
  const presentation = presentUptimeTone(percent);
  return `${presentation.theme.text} text-sm font-semibold`;
}
