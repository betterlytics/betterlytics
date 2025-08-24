'use client';

import { use } from 'react';
import { fetchOutboundLinksSummaryWithChartsAction } from '@/app/actions/outboundLinks';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';

type OutboundLinksSummarySectionProps = {
  outboundLinksSummaryWithChartsPromise: ReturnType<typeof fetchOutboundLinksSummaryWithChartsAction>;
};

export default function OutboundLinksSummarySection({
  outboundLinksSummaryWithChartsPromise,
}: OutboundLinksSummarySectionProps) {
  const summaryWithCharts = use(outboundLinksSummaryWithChartsPromise);

  const cards: SummaryCardData[] = [
    {
      title: 'Total Unique Clicks',
      value: summaryWithCharts.totalClicks.toLocaleString(),
      rawChartData: summaryWithCharts.dailyClicksChartData,
      valueField: 'outboundClicks',
      chartColor: 'var(--chart-1)',
    },
    {
      title: 'Unique Visitors',
      value: summaryWithCharts.uniqueVisitors.toLocaleString(),
      rawChartData: summaryWithCharts.dailyClicksChartData,
      valueField: 'outboundClicks',
      chartColor: 'var(--chart-2)',
    },
    {
      title: 'Top Domain',
      value: (
        <span className='overflow-wrap-anywhere leading-tight break-all'>
          {summaryWithCharts.topDomain || '-'}
        </span>
      ),
      rawChartData: summaryWithCharts.dailyClicksChartData,
      valueField: 'outboundClicks',
      chartColor: 'var(--chart-3)',
    },
    {
      title: 'Top Source Page',
      value: (
        <span className='overflow-wrap-anywhere leading-tight break-all'>
          {summaryWithCharts.topSourceUrl || '-'}
        </span>
      ),
      rawChartData: summaryWithCharts.dailyClicksChartData,
      valueField: 'outboundClicks',
      chartColor: 'var(--chart-4)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
