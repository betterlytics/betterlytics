'use client';
import { use } from 'react';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { CoreWebVitalsSummary } from '@/entities/webVitals';

type Props = {
  summaryPromise: Promise<CoreWebVitalsSummary>;
};

export default function WebVitalsSummaryCards({ summaryPromise }: Props) {
  const summary = use(summaryPromise);

  const cards: SummaryCardData[] = [
    {
      title: 'CLS p75',
      value: summary.clsP75 === null ? '—' : summary.clsP75.toFixed(3),
      chartColor: 'var(--chart-1)',
    },
    {
      title: 'LCP p75 (ms)',
      value: summary.lcpP75 === null ? '—' : Math.round(summary.lcpP75).toLocaleString(),
      chartColor: 'var(--chart-2)',
    },
    {
      title: 'INP p75 (ms)',
      value: summary.inpP75 === null ? '—' : Math.round(summary.inpP75).toLocaleString(),
      chartColor: 'var(--chart-3)',
    },
    {
      title: 'FCP p75 (ms)',
      value: summary.fcpP75 === null ? '—' : Math.round(summary.fcpP75).toLocaleString(),
      chartColor: 'var(--chart-4)',
    },
    {
      title: 'TTFB p75 (ms)',
      value: summary.ttfbP75 === null ? '—' : Math.round(summary.ttfbP75).toLocaleString(),
      chartColor: 'var(--chart-5)',
    },
  ];

  return <SummaryCardsSection className='lg:grid-cols-5' cards={cards} />;
}
