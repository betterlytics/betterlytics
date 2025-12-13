'use client';

import { useMemo } from 'react';
import MultiSeriesChart, { type MultiSeriesConfig } from '@/components/MultiSeriesChart';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { type MonitorMetrics } from '@/entities/analytics/monitoring.entities';
import { formatCompactFromMilliseconds } from '@/utils/dateFormatters';
import { useTranslations } from 'next-intl';

const P50_COLOR = 'var(--cwv-p50)';
const P95_COLOR = 'var(--cwv-p90)';
const AVG_COLOR = 'var(--muted-foreground)';

const SERIES: ReadonlyArray<MultiSeriesConfig> = [
  { dataKey: 'value.0', stroke: P50_COLOR, name: 'p50' },
  { dataKey: 'value.1', stroke: P95_COLOR, name: 'p95' },
  { dataKey: 'value.2', stroke: AVG_COLOR, name: 'avg', strokeDasharray: '6 6' },
] as const;

const RESPONSE_TIME_GRANULARITY: GranularityRangeValues = 'hour';

type ResponseTimeChartProps = {
  data?: MonitorMetrics['latencySeries'];
};

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  const t = useTranslations('monitoringDetailPage.responseTime');
  const chartData = useMemo(
    () =>
      (data ?? [])
        .map((point) => ({
          date: point.bucket,
          value: [point.p50Ms ?? null, point.p95Ms ?? null, point.avgMs ?? null],
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data],
  );

  if (!chartData.length) {
    return (
      <Card className='border-border/70 bg-card/80 p-5 shadow-lg shadow-black/10'>
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{t('title')}</p>
          <Badge
            variant='secondary'
            className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'
          >
            {t('badge')}
          </Badge>
        </div>
        <div className='border-border/60 bg-background/30 text-muted-foreground mt-4 flex h-48 items-center justify-center rounded-md border p-3 text-sm font-medium sm:h-60'>
          {t('empty')}
        </div>
      </Card>
    );
  }

  return (
    <MultiSeriesChart
      title={
        <p className='text-muted-foreground text-sm leading-tight font-semibold tracking-wide'>{t('title')}</p>
      }
      headerRight={
        <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
          {t('badge')}
        </Badge>
      }
      data={chartData}
      granularity={RESPONSE_TIME_GRANULARITY}
      formatValue={formatLatency}
      series={SERIES}
      className='border-border/70 bg-card/80 shadow-lg shadow-black/10'
    />
  );
}

function formatLatency(value: number) {
  if (value == null || Number.isNaN(value)) return '—';
  return formatCompactFromMilliseconds(value);
}
