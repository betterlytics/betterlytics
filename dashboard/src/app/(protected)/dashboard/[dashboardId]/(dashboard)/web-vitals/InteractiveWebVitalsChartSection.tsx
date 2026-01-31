'use client';
import { use, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Gauge } from '@/components/gauge';
import {
  CORE_WEB_VITAL_NAMES,
  CoreWebVitalName,
  CoreWebVitalsSummary,
} from '@/entities/analytics/webVitals.entities';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import type { MultiSeriesConfig } from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import { formatCompactFromMilliseconds } from '@/utils/dateFormatters';
import { formatCWV, getCwvLabelColor, getCwvGaugeProps } from '@/utils/coreWebVitals';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import MetricInfo from './MetricInfo';
import { useTranslations } from 'next-intl';

/** Maps CoreWebVitalsSummary keys to metric names */
const SUMMARY_KEY_MAP: Record<CoreWebVitalName, keyof CoreWebVitalsSummary> = {
  CLS: 'clsP75',
  LCP: 'lcpP75',
  INP: 'inpP75',
  FCP: 'fcpP75',
  TTFB: 'ttfbP75',
} as const;

/** Formats the metric value for display inside the Gauge */
function formatGaugeValue(metric: CoreWebVitalName, value: number | null): string {
  if (value === null) return '—';
  return metric === 'CLS' ? value.toFixed(3) : formatCompactFromMilliseconds(value);
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

  const chartData = useMemo(() => seriesByMetric[active] || [], [seriesByMetric, active]);

  const referenceLines = useMemo(
    () =>
      CWV_THRESHOLDS[active]?.map((y, idx) => {
        const stroke = idx === 0 ? 'var(--cwv-threshold-good)' : 'var(--cwv-threshold-fair)';
        const label = `${idx === 0 ? t('thresholds.good') : t('thresholds.fair')} (≤ ${formatThreshold(
          active,
          y,
        )})`;
        return { y, stroke, strokeDasharray: '4 6', label, labelFill: stroke };
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
        headerContent={
          <div>
            <CwvGaugeGrid summary={summary} activeMetric={active} onMetricSelect={setActive} />
            <div className='mt-6 flex items-center justify-between gap-3 p-2 sm:justify-center sm:gap-6'>
              <div className='text-muted-foreground flex min-w-0 flex-1 items-center gap-2 text-sm font-medium sm:flex-none'>
                <span className='truncate'>
                  {t(METRIC_LABEL_KEYS[active])}
                  <P75Badge />
                </span>
                <MetricInfo metric={active} />
              </div>
              <div className='ml-auto sm:ml-0'>
                <SeriesToggles defs={SERIES_DEFS} enabledKeys={enabledKeys} onToggle={toggleKey} />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

type CwvGaugeGridProps = {
  summary: CoreWebVitalsSummary;
  activeMetric: CoreWebVitalName;
  onMetricSelect: (metric: CoreWebVitalName) => void;
};

function CwvGaugeGrid({ summary, activeMetric, onMetricSelect }: CwvGaugeGridProps) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
      {CORE_WEB_VITAL_NAMES.map((metric) => {
        const value = summary[SUMMARY_KEY_MAP[metric]];
        const isActive = activeMetric === metric;

        return (
          <CwvGaugeCard
            key={metric}
            metric={metric}
            value={value}
            isActive={isActive}
            onClick={() => onMetricSelect(metric)}
          />
        );
      })}
    </div>
  );
}

type CwvGaugeCardProps = {
  metric: CoreWebVitalName;
  value: number | null;
  isActive: boolean;
  onClick: () => void;
};

function CwvGaugeCard({ metric, value, isActive, onClick }: CwvGaugeCardProps) {
  const gaugeProps = getCwvGaugeProps(metric, value);

  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center rounded-lg border p-2 transition-all duration-200',
        'hover:bg-accent/40 hover:border-primary/20 hover:shadow-sm',
        'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
        isActive ? 'border-primary/30 bg-card shadow-sm' : 'border-transparent',
      )}
    >
      <Gauge {...gaugeProps} size={140} strokeWidth={8} withNeedle totalAngle={240}>
        <div className='pointer-events-none absolute right-0 bottom-[20%] left-0 flex flex-col items-center'>
          <span className='text-muted-foreground/75 -mb-2 font-sans text-[10px] font-black tracking-[0.25em] uppercase'>
            {metric}
          </span>
          <span
            className='text-lg font-semibold tracking-tight drop-shadow-sm'
            style={{ color: getCwvLabelColor(metric, value) }}
          >
            {formatGaugeValue(metric, value)}
          </span>
        </div>
      </Gauge>
    </button>
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
