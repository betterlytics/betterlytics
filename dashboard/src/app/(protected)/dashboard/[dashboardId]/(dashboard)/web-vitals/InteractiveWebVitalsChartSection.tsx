'use client';
import { use, useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { Gauge } from '@/components/gauge';
import {
  CORE_WEB_VITAL_NAMES,
  CoreWebVitalName,
  CoreWebVitalsSummary,
} from '@/entities/analytics/webVitals.entities';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import {
  formatCWV,
  getCoreWebVitalLabelColor,
  getCoreWebVitalGaugeProps,
  PERCENTILE_KEYS,
  type PercentileKey,
} from '@/utils/coreWebVitals';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import MetricInfo from './MetricInfo';
import { useTranslations } from 'next-intl';

function P75Badge() {
  return <span className='text-muted-foreground ml-2 text-xs font-medium'>p75</span>;
}

type InteractiveWebVitalsChartSectionProps = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
  seriesPromise: Promise<CoreWebVitalsSeries>;
};

export default function InteractiveWebVitalsChartSection({
  summaryPromise,
  seriesPromise,
}: InteractiveWebVitalsChartSectionProps) {
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
        const label = `${idx === 0 ? t('thresholds.good') : t('thresholds.fair')} (≤ ${formatCWV(active, y)})`;
        return { y, stroke, strokeDasharray: '4 6', label, labelFill: stroke };
      }),
    [active, t],
  );

  const [enabledKeys, setEnabledKeys] = useState<Record<PercentileKey, boolean>>(
    () => Object.fromEntries(PERCENTILE_KEYS.map((k) => [k, true])) as Record<PercentileKey, boolean>,
  );

  const activeSeries = useMemo(
    () =>
      PERCENTILE_KEYS.map((key, i) => ({ key, i }))
        .filter(({ key }) => enabledKeys[key])
        .map(({ key, i }) => ({
          dataKey: `value.${i}`,
          stroke: `var(--cwv-${key})`,
          name: key.toUpperCase(),
        })),
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
            <CoreWebVitalsGaugeGrid summary={summary} activeMetric={active} onMetricSelect={setActive} />
            <div className='mt-6 flex items-center justify-between gap-3 p-2 sm:justify-center sm:gap-6'>
              <div className='text-muted-foreground flex min-w-0 flex-1 items-center gap-2 text-sm font-medium sm:flex-none'>
                <span className='truncate'>
                  {t(`metrics.${active}`)}
                  <P75Badge />
                </span>
                <MetricInfo metric={active} />
              </div>
              <PercentileLegend
                className='ml-auto sm:ml-0'
                enabledKeys={enabledKeys}
                setEnabledKeys={setEnabledKeys}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}

type CoreWebVitalsGaugeGridProps = {
  summary: CoreWebVitalsSummary;
  activeMetric: CoreWebVitalName;
  onMetricSelect: Dispatch<SetStateAction<CoreWebVitalName>>;
};

function CoreWebVitalsGaugeGrid({ summary, activeMetric, onMetricSelect }: CoreWebVitalsGaugeGridProps) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
      {CORE_WEB_VITAL_NAMES.map((metric) => (
        <CoreWebVitalGaugeCard
          key={metric}
          metric={metric}
          value={summary[`${metric.toLowerCase()}P75` as keyof CoreWebVitalsSummary]}
          isActive={activeMetric === metric}
          onSelect={onMetricSelect}
        />
      ))}
    </div>
  );
}

type CoreWebVitalGaugeCardProps = {
  metric: CoreWebVitalName;
  value: number | null;
  isActive: boolean;
  onSelect: Dispatch<SetStateAction<CoreWebVitalName>>;
};

function CoreWebVitalGaugeCard({ metric, value, isActive, onSelect }: CoreWebVitalGaugeCardProps) {
  return (
    <button
      type='button'
      onClick={() => onSelect(metric)}
      aria-pressed={isActive}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center rounded-lg border p-2 transition-all duration-200',
        'hover:bg-accent/40 hover:border-primary/20 hover:shadow-sm',
        'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
        isActive ? 'border-primary/30 bg-card shadow-sm' : 'border-transparent',
      )}
    >
      <Gauge {...getCoreWebVitalGaugeProps(metric, value)} size={140} strokeWidth={8} needle totalAngle={240}>
        <div className='pointer-events-none absolute right-0 bottom-[20%] left-0 flex flex-col items-center'>
          <span className='text-muted-foreground/75 -mb-2 font-sans text-[10px] font-black tracking-[0.25em] uppercase'>
            {metric}
          </span>
          <span
            className='text-lg font-semibold tracking-tight drop-shadow-sm'
            style={{ color: getCoreWebVitalLabelColor(metric, value) }}
          >
            {formatCWV(metric, value)}
          </span>
        </div>
      </Gauge>
    </button>
  );
}

type PercentileLegendProps = {
  enabledKeys: Record<PercentileKey, boolean>;
  setEnabledKeys: Dispatch<SetStateAction<Record<PercentileKey, boolean>>>;
  className?: string;
};

function PercentileLegend({ enabledKeys, setEnabledKeys, className }: PercentileLegendProps) {
  const toggleKey = useCallback(
    (key: PercentileKey) => {
      setEnabledKeys((prev) => {
        if (prev[key] && Object.values(prev).filter(Boolean).length === 1) return prev; // keep at least one enabled
        return { ...prev, [key]: !prev[key] };
      });
    },
    [setEnabledKeys],
  );

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center', className)}>
      {PERCENTILE_KEYS.map((pkey) => (
        <button
          key={pkey}
          type='button'
          onClick={() => toggleKey(pkey)}
          aria-pressed={enabledKeys[pkey]}
          className={cn(
            'inline-flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium sm:w-auto',
            enabledKeys[pkey]
              ? 'bg-primary/10 border-primary/20 text-popover-foreground'
              : 'bg-muted/30 border-border text-muted-foreground',
          )}
        >
          <span
            className={cn('h-3 w-3 rounded-sm', !enabledKeys[pkey] && 'opacity-40')}
            style={{ background: `var(--cwv-${pkey})` }}
          />
          <span>{pkey.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
