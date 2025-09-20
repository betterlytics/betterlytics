import { use } from 'react';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { ArrowRight } from 'lucide-react';
import { fetchFunnelDetailsAction } from '@/app/actions';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';

type FunnelSummarySectionProps = {
  funnelPromise: ReturnType<typeof fetchFunnelDetailsAction>;
};

export default function FunnelSummarySection({ funnelPromise }: FunnelSummarySectionProps) {
  const funnel = use(funnelPromise);
  const t = useTranslations('components.funnels.details');
  const tFilters = useTranslations('components.filters');

  const firstFilter = formatQueryFilter(funnel.biggestDropOff.stepFilters[0], tFilters);
  const secondFilter = formatQueryFilter(funnel.biggestDropOff.stepFilters[1], tFilters);

  const cards: SummaryCardData[] = [
    {
      title: t('summary.overallConversion'),
      value: `${formatPercentage(Math.floor(100 * funnel.conversionRate))}`,
    },
    {
      title: t('summary.totalVisitors'),
      value: `${funnel.visitorCount.max}`,
    },
    {
      title: t('summary.totalCompleted'),
      value: `${funnel.visitorCount.min}`,
    },
    {
      title: t('summary.biggestDropOff'),
      value: (
        <span className='flex overflow-hidden overflow-x-auto text-sm text-ellipsis'>
          {firstFilter} <ArrowRight className='mx-1 max-w-[1rem] min-w-[1rem]' />{' '}
          {secondFilter}
        </span>
      ),
    },
  ];

  return <SummaryCardsSection cards={cards} className='!grid-cols-1' />;
}
