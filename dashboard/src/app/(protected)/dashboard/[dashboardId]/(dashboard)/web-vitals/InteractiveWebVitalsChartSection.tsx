'use client';
import { use, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { Gauge } from '@/components/gauge';
import {
  CORE_WEB_VITAL_NAMES,
  CoreWebVitalName,
  CoreWebVitalsSummary,
} from '@/entities/analytics/webVitals.entities';
import MultiSeriesChart, { type MultiSeriesConfig } from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import {
  formatCWV,
  getCoreWebVitalLabelColor,
  getCoreWebVitalGaugeProps,
  PERCENTILE_KEYS,
  CORE_WEB_VITAL_LEVELS,
} from '@/utils/coreWebVitals';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import MetricInfo from './MetricInfo';
import { useTranslations } from 'next-intl';

const SERIES_DEFS: ReadonlyArray<MultiSeriesConfig> = PERCENTILE_KEYS.map((key, i) => ({
  dataKey: `value.${i}`,
  stroke: `var(--cwv-${key})`,
  name: key.toUpperCase(),
}));

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

  const yReferenceAreas = useMemo(() => {
    const [good, fair] = CWV_THRESHOLDS[active];
    const bounds = [0, good, fair, active === 'CLS' ? 10 : 1_000_000];
    return CORE_WEB_VITAL_LEVELS.map((level, i) => ({
      y1: bounds[i],
      y2: bounds[i + 1],
      fill: `var(--cwv-threshold-${level})`,
      fillOpacity: 0.08,
      label: t(`thresholds.${level}`),
      labelFill: `var(--cwv-threshold-${level}-label)`,
    }));
  }, [active, t]);

  return (
    <div className='space-y-6'>
      <MultiSeriesChart
        title={undefined}
        data={chartData}
        granularity={granularity}
        formatValue={(v) => formatCWV(active, Number(v))}
        yDomain={active === 'CLS' ? [0, (dataMax: number) => Math.max(1, Number(dataMax || 0))] : undefined}
        series={SERIES_DEFS}
        yReferenceAreas={yReferenceAreas}
        headerContent={
          <div>
            <CoreWebVitalsGaugeGrid summary={summary} activeMetric={active} onMetricSelect={setActive} />
            <div className='mt-6 flex items-center justify-center gap-2 p-2'>
              <span className='text-muted-foreground text-sm font-medium'>{t(`metrics.${active}`)}</span>
              <MetricInfo metric={active} />
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
        'group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-md border p-2 transition-shadow duration-160',
        'hover:bg-accent/40 hover:border-primary/20 hover:shadow-sm',
        'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
        isActive ? 'border-transparent shadow-sm' : 'border-transparent',
      )}
      style={{ background: isActive ? 'var(--card-interactive)' : undefined }}
    >
      {/* Left accent rail */}
      <span
        className='absolute top-0 left-0 h-full w-[3px] rounded-r'
        style={{ background: isActive ? 'var(--chart-1)' : 'transparent' }}
        aria-hidden='true'
      />
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
