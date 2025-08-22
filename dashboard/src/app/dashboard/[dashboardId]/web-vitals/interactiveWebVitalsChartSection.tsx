'use client';
import { use, useState } from 'react';
import { cn } from '@/lib/utils';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import CoreWebVitalBar from '@/components/dashboard/CoreWebVitalBar';
import { CoreWebVitalName, CoreWebVitalsSummary } from '@/entities/webVitals';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import type { MultiSeriesConfig } from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import { formatShortFromMilliseconds, formatCompactFromMilliseconds } from '@/utils/dateFormatters';
import { formatCWV, getCwvStatusColor } from '@/utils/formatters';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

type Props = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
  seriesPromise: Promise<CoreWebVitalsSeries>;
};

export default function InteractiveWebVitalsChartSection({ summaryPromise, seriesPromise }: Props) {
  const summary = use(summaryPromise);
  const { granularity } = useTimeRangeContext();
  const [active, setActive] = useState<CoreWebVitalName>('CLS');
  const seriesByMetric = use(seriesPromise);

  function formatCardValue(metric: CoreWebVitalName, value: number | null): React.ReactNode {
    if (value === null) return '—';
    const colorStyle: React.CSSProperties = { color: getCwvStatusColor(metric, value) };

    const display = metric === 'CLS' ? value.toFixed(3) : formatCompactFromMilliseconds(value);
    return <span style={colorStyle}>{display}</span>;
  }

  const P75Badge = () => <span className='text-muted-foreground ml-2 text-xs font-medium'>p75</span>;

  const cards: SummaryCardData[] = [
    {
      title: (
        <span>
          Cumulative Layout Shift
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
          Largest Contentful Paint
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
          Interaction to Next Paint
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
          First Contentful Paint
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
          Time to First Byte
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
  ];

  const titles: Record<CoreWebVitalName, string> = {
    CLS: 'Cumulative Layout Shift',
    LCP: 'Largest Contentful Paint',
    INP: 'Interaction to Next Paint',
    FCP: 'First Contentful Paint',
    TTFB: 'Time to First Byte',
  } as const;

  const chartData = seriesByMetric[active] || [];

  function formatThreshold(metric: CoreWebVitalName, value: number): string {
    if (metric === 'CLS') return value.toString();
    return formatShortFromMilliseconds(value);
  }

  const referenceLines = CWV_THRESHOLDS[active]?.map((y, idx) => {
    const label = `${idx === 0 ? 'Good' : 'Needs improvement'} (≤ ${formatThreshold(active, y)})`;
    const stroke = idx === 0 ? 'var(--cwv-threshold-good)' : 'var(--cwv-threshold-ni)';
    return { y, label, stroke, strokeDasharray: '6 6', labelFill: stroke };
  });

  const SERIES_DEFS: ReadonlyArray<MultiSeriesConfig> = [
    { dataKey: 'value.0', stroke: 'var(--cwv-p50)', name: 'P50' },
    { dataKey: 'value.1', stroke: 'var(--cwv-p75)', name: 'P75' },
    { dataKey: 'value.2', stroke: 'var(--cwv-p90)', name: 'P90' },
    { dataKey: 'value.3', stroke: 'var(--cwv-p99)', name: 'P99' },
  ] as const;

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

  const activeSeries: MultiSeriesConfig[] = SERIES_DEFS.filter((d) => enabledKeys.has(d.dataKey));

  return (
    <div className='space-y-6'>
      <SummaryCardsSection className='lg:grid-cols-5' cards={cards} />
      <MultiSeriesChart
        title={
          <span className='flex items-center gap-2'>
            {titles[active]}
            <MetricInfo metric={active} />
          </span>
        }
        data={chartData}
        granularity={granularity}
        formatValue={(v) => formatCWV(active, Number(v))}
        series={activeSeries}
        referenceLines={referenceLines}
        headerRight={<SeriesToggles defs={SERIES_DEFS} enabledKeys={enabledKeys} onToggle={toggleKey} />}
      />
    </div>
  );
}

function MetricInfo({ metric }: { metric: CoreWebVitalName }) {
  const desc: Record<CoreWebVitalName, string> = {
    CLS: 'Measures visual stability. CLS captures how much content unexpectedly shifts while the page loads.',
    LCP: 'Measures loading performance. LCP is the moment the largest text or image becomes visible.',
    INP: 'Measures responsiveness. INP is the time from a user action until the next visual update.',
    FCP: 'Shows when the first piece of content appears on the screen during page load.',
    TTFB: 'Measures server response speed — the time from request until the first byte is received.',
  } as const;

  const [goodRaw, niRaw] = CWV_THRESHOLDS[metric] ?? [];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type='button' aria-label='About metric' className='text-muted-foreground hover:text-foreground'>
          <Info className='h-4 w-4' />
        </button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>
        <div className='max-w-[260px] space-y-2'>
          <p className='text-primary-foreground/90'>{desc[metric]}</p>

          <div className='bg-primary-foreground/20 h-px' />
          <div className='text-[11px] leading-4'>
            <div>
              <span className='opacity-80'>Good:</span> ≤ {formatCWV(metric, goodRaw)}
            </div>
            <div>
              <span className='opacity-80'>Needs improvement:</span> ≤ {formatCWV(metric, niRaw)}
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

type ToggleProps = {
  defs: ReadonlyArray<MultiSeriesConfig>;
  enabledKeys: Set<string>;
  onToggle: (key: string) => void;
};

function SeriesToggles({ defs, enabledKeys, onToggle }: ToggleProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {defs.map((d) => {
        const isOn = enabledKeys.has(d.dataKey);
        return (
          <button
            key={d.dataKey}
            type='button'
            onClick={() => onToggle(d.dataKey)}
            aria-pressed={isOn}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium',
              isOn
                ? 'bg-primary/10 border-primary/20 text-popover-foreground'
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
