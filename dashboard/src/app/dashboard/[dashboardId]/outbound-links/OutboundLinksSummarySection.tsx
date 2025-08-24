'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { fetchOutboundLinksSummaryWithChartsAction } from '@/app/actions/outboundLinks';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';

type OutboundLinksSummarySectionProps = {
  outboundLinksSummaryWithChartsPromise: ReturnType<typeof fetchOutboundLinksSummaryWithChartsAction>;
};

export default function OutboundLinksSummarySection({
  outboundLinksSummaryWithChartsPromise,
}: OutboundLinksSummarySectionProps) {
  const summaryWithCharts = use(outboundLinksSummaryWithChartsPromise);
  const t = useTranslations('components.outboundLinks.summary');

  const cards: SummaryCardData[] = [
    {
      title: t('totalUniqueClicks'),
      value: summaryWithCharts.totalClicks.toLocaleString(),
      rawChartData: summaryWithCharts.dailyClicksChartData,
      valueField: 'outboundClicks',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('uniqueVisitors'),
      value: summaryWithCharts.uniqueVisitors.toLocaleString(),
      rawChartData: summaryWithCharts.dailyClicksChartData,
      valueField: 'outboundClicks',
      chartColor: 'var(--chart-2)',
    },
    {
      title: t('topDomain'),
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
      title: t('topSourcePage'),
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
