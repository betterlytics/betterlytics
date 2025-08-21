'use client';
import { use, useMemo, useState } from 'react';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { CoreWebVitalName, CoreWebVitalSeriesRow, CoreWebVitalsSummary } from '@/entities/webVitals';
import InteractiveChart from '@/components/InteractiveChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type Props = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
  seriesPromise: Promise<
    readonly [
      CoreWebVitalSeriesRow[],
      CoreWebVitalSeriesRow[],
      CoreWebVitalSeriesRow[],
      CoreWebVitalSeriesRow[],
      CoreWebVitalSeriesRow[],
    ]
  >;
};

export default function InteractiveWebVitalsChartSection({ summaryPromise, seriesPromise }: Props) {
  const summary = use(summaryPromise);
  const { granularity } = useTimeRangeContext();
  const [active, setActive] = useState<CoreWebVitalName>('CLS');
  const [clsSeries, lcpSeries, inpSeries, fcpSeries, ttfbSeries] = use(seriesPromise);

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

  const seriesByMetric = useMemo(
    () => ({ CLS: clsSeries, LCP: lcpSeries, INP: inpSeries, FCP: fcpSeries, TTFB: ttfbSeries }),
    [clsSeries, lcpSeries, inpSeries, fcpSeries, ttfbSeries],
  );

  const colorByMetric: Record<CoreWebVitalName, string> = {
    CLS: 'var(--chart-1)',
    LCP: 'var(--chart-2)',
    INP: 'var(--chart-3)',
    FCP: 'var(--chart-4)',
    TTFB: 'var(--chart-5)',
  } as const;

  const chartData = useMemo(
    () => (seriesByMetric[active] || []).map((r) => ({ date: r.date, value: [r.value] })),
    [seriesByMetric, active],
  );
  const color = colorByMetric[active];

  return (
    <div className='space-y-6'>
      <SummaryCardsSection className='lg:grid-cols-5' cards={cards} />
      <InteractiveChart title={titles[active]} data={chartData} color={color} granularity={granularity} />
    </div>
  );
}
