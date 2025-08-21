'use client';
import { use, useState } from 'react';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import CoreWebVitalBar from '@/components/dashboard/CoreWebVitalBar';
import { CoreWebVitalName, CoreWebVitalsSummary } from '@/entities/webVitals';
import MultiSeriesChart from '@/components/MultiSeriesChart';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { CoreWebVitalsSeries } from '@/presenters/toMultiLine';
import { formatShortFromMilliseconds, formatCompactFromMilliseconds } from '@/utils/dateFormatters';

type Props = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
  seriesPromise: Promise<CoreWebVitalsSeries>;
};

export default function InteractiveWebVitalsChartSection({ summaryPromise, seriesPromise }: Props) {
  const summary = use(summaryPromise);
  const { granularity } = useTimeRangeContext();
  const [active, setActive] = useState<CoreWebVitalName>('CLS');
  const seriesByMetric = use(seriesPromise);

  // Thresholds values are taken from Web.dev
  const thresholds: Partial<Record<CoreWebVitalName, number[]>> = {
    // CLS: good <= 0.1, medium 0.1-0.25
    CLS: [0.1, 0.25],
    // LCP: good <= 2500ms, medium 2500-4000
    LCP: [2500, 4000],
    // INP: good <= 200ms, medium 200-500
    INP: [200, 500],
    // FCP: good <= 1800ms, medium 1800-3000
    FCP: [1800, 3000],
    // TTFB: good <= 800ms, medium 800-1800
    TTFB: [800, 1800],
  };

  function getStatusColor(metric: CoreWebVitalName, value: number): string {
    const [goodThreshold, niThreshold] = thresholds[metric] ?? [];
    if (goodThreshold === undefined || niThreshold === undefined) return '';
    if (value > niThreshold) return 'var(--cwv-threshold-poor)';
    if (value > goodThreshold) return 'var(--cwv-threshold-ni)';
    return 'var(--cwv-threshold-good)';
  }

  function formatCardValue(metric: CoreWebVitalName, value: number | null): React.ReactNode {
    if (value === null) return '—';
    const colorStyle: React.CSSProperties = { color: getStatusColor(metric, value) };

    const display = metric === 'CLS' ? value.toFixed(3) : formatCompactFromMilliseconds(value);
    return <span style={colorStyle}>{display}</span>;
  }

  const cards: SummaryCardData[] = [
    {
      title: 'Cumulative Layout Shift (p75)',
      value: formatCardValue('CLS', summary.clsP75),
      footer:
        summary.clsP75 === null ? null : (
          <div style={{ color: getStatusColor('CLS', summary.clsP75) }}>
            <CoreWebVitalBar metric='CLS' value={summary.clsP75} thresholds={thresholds} />
          </div>
        ),
      chartColor: 'var(--chart-1)',
      isActive: active === 'CLS',
      onClick: () => setActive('CLS'),
    },
    {
      title: 'Largest Contentful Paint (p75)',
      value: formatCardValue('LCP', summary.lcpP75),
      footer:
        summary.lcpP75 === null ? null : (
          <div style={{ color: getStatusColor('LCP', summary.lcpP75) }}>
            <CoreWebVitalBar metric='LCP' value={summary.lcpP75} thresholds={thresholds} />
          </div>
        ),
      chartColor: 'var(--chart-2)',
      isActive: active === 'LCP',
      onClick: () => setActive('LCP'),
    },
    {
      title: 'Interaction to Next Paint (p75)',
      value: formatCardValue('INP', summary.inpP75),
      footer:
        summary.inpP75 === null ? null : (
          <div style={{ color: getStatusColor('INP', summary.inpP75) }}>
            <CoreWebVitalBar metric='INP' value={summary.inpP75} thresholds={thresholds} />
          </div>
        ),
      chartColor: 'var(--chart-3)',
      isActive: active === 'INP',
      onClick: () => setActive('INP'),
    },
    {
      title: 'First Contentful Paint (p75)',
      value: formatCardValue('FCP', summary.fcpP75),
      footer:
        summary.fcpP75 === null ? null : (
          <div style={{ color: getStatusColor('FCP', summary.fcpP75) }}>
            <CoreWebVitalBar metric='FCP' value={summary.fcpP75} thresholds={thresholds} />
          </div>
        ),
      chartColor: 'var(--chart-4)',
      isActive: active === 'FCP',
      onClick: () => setActive('FCP'),
    },
    {
      title: 'Time to First Byte (p75)',
      value: formatCardValue('TTFB', summary.ttfbP75),
      footer:
        summary.ttfbP75 === null ? null : (
          <div style={{ color: getStatusColor('TTFB', summary.ttfbP75) }}>
            <CoreWebVitalBar metric='TTFB' value={summary.ttfbP75} thresholds={thresholds} />
          </div>
        ),
      chartColor: 'var(--chart-5)',
      isActive: active === 'TTFB',
      onClick: () => setActive('TTFB'),
    },
  ];

  const titles: Record<CoreWebVitalName, string> = {
    CLS: 'Cumulative Layout Shift',
    LCP: 'Largest Contentful Paint (ms)',
    INP: 'Interaction to Next Paint (ms)',
    FCP: 'First Contentful Paint (ms)',
    TTFB: 'Time to First Byte (ms)',
  } as const;

  const chartData = seriesByMetric[active] || [];

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
