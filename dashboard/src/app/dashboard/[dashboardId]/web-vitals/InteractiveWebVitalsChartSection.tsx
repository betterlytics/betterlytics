'use client';
import { use, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import InlineMetricsHeader from '@/components/dashboard/InlineMetricsHeader';
import CoreWebVitalBar from '@/components/dashboard/CoreWebVitalBar';
import { CoreWebVitalName, CoreWebVitalsSummary } from '@/entities/webVitals';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import type { MultiSeriesConfig } from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import { formatShortFromMilliseconds, formatCompactFromMilliseconds } from '@/utils/dateFormatters';
import { formatCWV, getCwvStatusColor } from '@/utils/formatters';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import MetricInfo from '@/app/dashboard/[dashboardId]/web-vitals/MetricInfo';
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
  return formatShortFromMilliseconds(value);
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

  const referenceLines = useMemo(
    () =>
      CWV_THRESHOLDS[active]?.map((y, idx) => {
        const label = `${idx === 0 ? t('thresholds.good') : t('thresholds.needsImprovement')} (≤ ${formatThreshold(
          active,
          y,
        )})`;
        const stroke = idx === 0 ? 'var(--cwv-threshold-good)' : 'var(--cwv-threshold-ni)';
        return { y, label, stroke, strokeDasharray: '6 6', labelFill: stroke };
      }),
    [active, t],
  );

  const [enabledKeys, setEnabledKeys] = useState(() => new Set(SERIES_DEFS.map((d) => d.dataKey)));

  function toggleKey(key: string) {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return next; // keep at least one enabled
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const activeSeries: MultiSeriesConfig[] = useMemo(
    () => SERIES_DEFS.filter((d) => enabledKeys.has(d.dataKey)),
    [enabledKeys],
  );

  return (
    <div className='space-y-6'>
      <MultiSeriesChart
        title={undefined}
        data={chartData}
        granularity={granularity}
        formatValue={(v) => formatCWV(active, Number(v))}
        yDomain={active === 'CLS' ? [0, (dataMax: number) => Math.max(1, Number(dataMax || 0))] : undefined}
        series={activeSeries}
        referenceLines={referenceLines}
        headerRight={undefined}
        headerContent={
          <div className='space-y-3'>
            <InlineMetricsHeader cards={cards} widthClass='sm:w-[228px] md:w-[270px]' pinFooter />
            <div className='flex items-center justify-center gap-4'>
              <span className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                {t(METRIC_LABEL_KEYS[active])}
                <MetricInfo metric={active} />
              </span>
              <SeriesToggles defs={SERIES_DEFS} enabledKeys={enabledKeys} onToggle={toggleKey} />
            </div>
          </div>
        }
      />
    </div>
  );
}

type ToggleProps = {
  defs: ReadonlyArray<MultiSeriesConfig>;
  enabledKeys: Set<string>;
  onToggle: (key: string) => void;
};

function SeriesToggles({ defs, enabledKeys, onToggle }: ToggleProps) {
  const isAnyEnabled = useMemo(() => enabledKeys.size, [enabledKeys]);

  return (
    <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center'>
      {defs.map((d) => {
        const isOn = enabledKeys.has(d.dataKey);
        return (
          <button
            key={d.dataKey}
            type='button'
            onClick={() => onToggle(d.dataKey)}
            disabled={!isAnyEnabled}
            aria-pressed={isOn}
            className={cn(
              'inline-flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium sm:w-auto',
              isOn
                ? 'bg-primary/10 border-primary/20 text-popover-foreground disabled:opacity-50'
                : 'bg-muted/30 border-border text-muted-foreground',
            )}
          >
            <span
              className={cn('h-3 w-3 rounded-sm', isOn ? undefined : 'opacity-40')}
              style={{ background: d.stroke }}
            />
            <span>{d.name || String(d.dataKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
