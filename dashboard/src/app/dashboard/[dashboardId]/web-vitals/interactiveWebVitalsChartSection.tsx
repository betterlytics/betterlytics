'use client';
import { use, useState } from 'react';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { CoreWebVitalName, CoreWebVitalsSummary } from '@/entities/webVitals';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import { formatShortFromMilliseconds } from '@/utils/dateFormatters';

type Props = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
  seriesPromise: Promise<CoreWebVitalsSeries>;
};

export default function InteractiveWebVitalsChartSection({ summaryPromise, seriesPromise }: Props) {
  const summary = use(summaryPromise);
  const { granularity } = useTimeRangeContext();
  const [active, setActive] = useState<CoreWebVitalName>('CLS');
  const seriesByMetric = use(seriesPromise);

  const cards: SummaryCardData[] = [
    {
      title: 'CLS p75',
      value: summary.clsP75 === null ? '—' : summary.clsP75.toFixed(3),
      chartColor: 'var(--chart-1)',
      isActive: active === 'CLS',
      onClick: () => setActive('CLS'),
    },
    {
      title: 'LCP p75 (ms)',
      value: summary.lcpP75 === null ? '—' : Math.round(summary.lcpP75).toLocaleString(),
      chartColor: 'var(--chart-2)',
      isActive: active === 'LCP',
      onClick: () => setActive('LCP'),
    },
    {
      title: 'INP p75 (ms)',
      value: summary.inpP75 === null ? '—' : Math.round(summary.inpP75).toLocaleString(),
      chartColor: 'var(--chart-3)',
      isActive: active === 'INP',
      onClick: () => setActive('INP'),
    },
    {
      title: 'FCP p75 (ms)',
      value: summary.fcpP75 === null ? '—' : Math.round(summary.fcpP75).toLocaleString(),
      chartColor: 'var(--chart-4)',
      isActive: active === 'FCP',
      onClick: () => setActive('FCP'),
    },
    {
      title: 'TTFB p75 (ms)',
      value: summary.ttfbP75 === null ? '—' : Math.round(summary.ttfbP75).toLocaleString(),
      chartColor: 'var(--chart-5)',
      isActive: active === 'TTFB',
      onClick: () => setActive('TTFB'),
    },
  ];

  const titles: Record<CoreWebVitalName, string> = {
    CLS: 'CLS',
    LCP: 'LCP (ms)',
    INP: 'INP (ms)',
    FCP: 'FCP (ms)',
    TTFB: 'TTFB (ms)',
  } as const;

  const chartData = seriesByMetric[active] || [];

  // Thresholds values are taken from Web.dev
  const thresholds: Partial<Record<CoreWebVitalName, number[]>> = {
    // CLS: good <= 0.1, medium 0.1-0.25
    CLS: [0.1, 0.25],
    // LCP: good <= 2500ms, medium 2500-4000
    LCP: [2500, 4000],
    // FCP: good <= 1800ms, medium 1800-3000
    FCP: [1800, 3000],
    // TTFB: good <= 800ms, medium 800-1800
    TTFB: [800, 1800],
  };

  function formatThreshold(metric: CoreWebVitalName, value: number): string {
    if (metric === 'CLS') return value.toString();
    return formatShortFromMilliseconds(value);
  }

  const referenceLines = thresholds[active]?.map((y, idx) => {
    const label = `${idx === 0 ? 'Good' : 'Needs improvement'} (≤ ${formatThreshold(active, y)})`;
    const stroke = idx === 0 ? 'var(--cwv-threshold-good)' : 'var(--cwv-threshold-ni)';
    return { y, label, stroke, strokeDasharray: '6 6', labelFill: stroke };
  });

  return (
    <div className='space-y-6'>
      <SummaryCardsSection className='lg:grid-cols-5' cards={cards} />
      <MultiSeriesChart
        title={titles[active]}
        data={chartData}
        granularity={granularity}
        series={[
          { dataKey: 'value.0', stroke: 'var(--cwv-p50)' }, // p50
          { dataKey: 'value.1', stroke: 'var(--cwv-p75)' }, // p75
          { dataKey: 'value.2', stroke: 'var(--cwv-p90)' }, // p90
          { dataKey: 'value.3', stroke: 'var(--cwv-p99)' }, // p99
        ]}
        referenceLines={referenceLines}
      />
    </div>
  );
}
