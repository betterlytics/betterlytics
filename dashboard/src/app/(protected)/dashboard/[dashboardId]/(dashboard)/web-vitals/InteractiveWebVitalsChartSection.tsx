'use client';
import { use, useMemo, useState } from 'react';
import { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import InlineMetricsHeader from '@/components/dashboard/InlineMetricsHeader';
import CoreWebVitalBar from '@/components/dashboard/CoreWebVitalBar';
import { CoreWebVitalName, CoreWebVitalsSummary } from '@/entities/analytics/webVitals.entities';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import type { MultiSeriesConfig } from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import { formatCompactFromMilliseconds } from '@/utils/dateFormatters';
import { formatCWV, getCwvStatusColor } from '@/utils/formatters';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import MetricInfo from './MetricInfo';
import { useTranslations } from 'next-intl';

function formatCardValue(metric: CoreWebVitalName, value: number | null) {
  if (value === null) return '—';
  const colorStyle: React.CSSProperties = { color: getCwvStatusColor(metric, value) };

  const display = metric === 'CLS' ? value.toFixed(3) : formatCompactFromMilliseconds(value);
  return <span style={colorStyle}>{display}</span>;
}

function P75Badge() {
  return <span className='text-muted-foreground ml-2 text-xs font-medium'>p75</span>;
}

const METRIC_LABEL_KEYS: Record<
  CoreWebVitalName,
  'metrics.CLS' | 'metrics.LCP' | 'metrics.INP' | 'metrics.FCP' | 'metrics.TTFB'
> = {
  CLS: 'metrics.CLS',
  LCP: 'metrics.LCP',
  INP: 'metrics.INP',
  FCP: 'metrics.FCP',
  TTFB: 'metrics.TTFB',
} as const;

const SERIES_DEFS: ReadonlyArray<MultiSeriesConfig> = [
  { dataKey: 'value.0', stroke: 'var(--cwv-p50)', name: 'P50' },
  { dataKey: 'value.1', stroke: 'var(--cwv-p75)', name: 'P75' },
  { dataKey: 'value.2', stroke: 'var(--cwv-p90)', name: 'P90' },
  { dataKey: 'value.3', stroke: 'var(--cwv-p99)', name: 'P99' },
] as const;

function formatThreshold(metric: CoreWebVitalName, value: number): string {
  if (metric === 'CLS') return value.toString();
  return formatCompactFromMilliseconds(value);
}

type Props = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
  seriesPromise: Promise<CoreWebVitalsSeries>;
};

export default function InteractiveWebVitalsChartSection({ summaryPromise, seriesPromise }: Props) {
  const t = useTranslations('components.webVitals');
  const summary = use(summaryPromise);
  const { granularity } = useTimeRangeContext();
  const [active, setActive] = useState<CoreWebVitalName>('CLS');
  const seriesByMetric = use(seriesPromise);

  const cards: SummaryCardData[] = useMemo(
    () => [
      {
        title: (
          <span>
            {t('metrics.CLS')}
            <P75Badge />
          </span>
        ),
        value: formatCardValue('CLS', summary.clsP75),
        footer:
          summary.clsP75 === null ? null : (
            <div style={{ color: getCwvStatusColor('CLS', summary.clsP75) }}>
              <CoreWebVitalBar metric='CLS' value={summary.clsP75} thresholds={CWV_THRESHOLDS} />
            </div>
          ),
        chartColor: 'var(--chart-1)',
        isActive: active === 'CLS',
        onClick: () => setActive('CLS'),
      },
      {
        title: (
          <span>
            {t('metrics.LCP')}
            <P75Badge />
          </span>
        ),
        value: formatCardValue('LCP', summary.lcpP75),
        footer:
          summary.lcpP75 === null ? null : (
            <div style={{ color: getCwvStatusColor('LCP', summary.lcpP75) }}>
              <CoreWebVitalBar metric='LCP' value={summary.lcpP75} thresholds={CWV_THRESHOLDS} />
            </div>
          ),
        chartColor: 'var(--chart-2)',
        isActive: active === 'LCP',
        onClick: () => setActive('LCP'),
      },
      {
        title: (
          <span>
            {t('metrics.INP')}
            <P75Badge />
          </span>
        ),
        value: formatCardValue('INP', summary.inpP75),
        footer:
          summary.inpP75 === null ? null : (
            <div style={{ color: getCwvStatusColor('INP', summary.inpP75) }}>
              <CoreWebVitalBar metric='INP' value={summary.inpP75} thresholds={CWV_THRESHOLDS} />
            </div>
          ),
        chartColor: 'var(--chart-3)',
        isActive: active === 'INP',
        onClick: () => setActive('INP'),
      },
      {
        title: (
          <span>
            {t('metrics.FCP')}
            <P75Badge />
          </span>
        ),
        value: formatCardValue('FCP', summary.fcpP75),
        footer:
          summary.fcpP75 === null ? null : (
            <div style={{ color: getCwvStatusColor('FCP', summary.fcpP75) }}>
              <CoreWebVitalBar metric='FCP' value={summary.fcpP75} thresholds={CWV_THRESHOLDS} />
            </div>
          ),
        chartColor: 'var(--chart-4)',
        isActive: active === 'FCP',
        onClick: () => setActive('FCP'),
      },
      {
        title: (
          <span>
            {t('metrics.TTFB')}
            <P75Badge />
          </span>
        ),
        value: formatCardValue('TTFB', summary.ttfbP75),
        footer:
          summary.ttfbP75 === null ? null : (
            <div style={{ color: getCwvStatusColor('TTFB', summary.ttfbP75) }}>
              <CoreWebVitalBar metric='TTFB' value={summary.ttfbP75} thresholds={CWV_THRESHOLDS} />
            </div>
          ),
        chartColor: 'var(--chart-5)',
        isActive: active === 'TTFB',
        onClick: () => setActive('TTFB'),
      },
    ],
    [summary, active, t],
  );

  const chartData = useMemo(() => seriesByMetric[active] || [], [seriesByMetric, active]);

  const yReferenceAreas = useMemo(() => {
    const thresholds = CWV_THRESHOLDS[active];
    if (!thresholds) return [];
    const [goodThreshold, fairThreshold] = thresholds;
    return [
      {
        y1: 0 as const,
        y2: goodThreshold,
        fill: 'var(--cwv-threshold-good)',
        fillOpacity: 0.08,
        label: t('thresholds.good'),
        labelFill: 'var(--cwv-threshold-good-label)',
      },
      {
        y1: goodThreshold,
        y2: fairThreshold,
        fill: 'var(--cwv-threshold-fair)',
        fillOpacity: 0.08,
        label: t('thresholds.fair'),
        labelFill: 'var(--cwv-threshold-fair-label)',
      },
      {
        y1: fairThreshold,
        y2: active === 'CLS' ? 10 : 1000000,
        fill: 'var(--cwv-threshold-poor)',
        fillOpacity: 0.08,
        label: t('thresholds.poor'),
        labelFill: 'var(--cwv-threshold-poor-label)',
      },
    ];
  }, [active, t]);

  return (
    <div className='space-y-6'>
      <MultiSeriesChart
        title={undefined}
        data={chartData}
        granularity={granularity}
        formatValue={(v) => formatCWV(active, Number(v))}
        yDomain={active === 'CLS' ? [0, (dataMax: number) => Math.max(1, Number(dataMax || 0))] : undefined}
        series={SERIES_DEFS as MultiSeriesConfig[]}
        yReferenceAreas={yReferenceAreas}
        headerContent={
          <div>
            <InlineMetricsHeader cards={cards} pinFooter />
            <div className='mt-6 flex items-center justify-center gap-2 p-2'>
              <span className='text-muted-foreground text-sm font-medium'>{t(METRIC_LABEL_KEYS[active])}</span>
              <MetricInfo metric={active} />
            </div>
          </div>
        }
      />
    </div>
  );
}
