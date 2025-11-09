'use client';

import { use, ReactNode } from 'react';
import { fetchFunnelsAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { ArrowRightCircleIcon } from 'lucide-react';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { FunnelsEmptyState } from './FunnelsEmptyState';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';

type FunnelsListSectionProps = {
  funnelsPromise: ReturnType<typeof fetchFunnelsAction>;
};

export default function FunnelsListSection({ funnelsPromise }: FunnelsListSectionProps) {
  const funnels = use(funnelsPromise);
  const t = useTranslations('components.funnels.list');

  if (funnels.length === 0) {
    return <FunnelsEmptyState />;
  }

  return (
    <div className='space-y-5'>
      {funnels.map((funnel) => (
        <div
          key={funnel.id}
          className='bg-card grid grid-cols-4 grid-rows-5 gap-2 rounded-md border p-3 shadow md:grid-rows-2'
        >
          <div className='col-span-3 flex gap-2'>
            <h1 className='text-xl font-semibold'>{funnel.name}</h1>
            <Badge className='text-muted-foreground mt-0.5 h-[1.5rem] rounded-full' variant='outline'>
              {funnel.stepCount} {t('steps')}
            </Badge>
          </div>
          <div className='col-span-1 flex justify-end'>
            <FilterPreservingLink className='mr-2 text-right' href={`funnels/${funnel.id}`}>
              <ArrowRightCircleIcon />
            </FilterPreservingLink>
          </div>
          <div className='col-span-4 row-span-4 grid gap-2 md:row-span-1 md:grid-cols-4'>
            <InlineDataDisplay
              title={t('conversionRate')}
              value={`${formatPercentage(100 * funnel.conversionRate)}`}
            />
            <InlineDataDisplay title={t('completed')} value={funnel.visitorCount.min} />
            <InlineDataDisplay title={t('totalUsers')} value={funnel.visitorCount.max} />
            <InlineDataDisplay
              title={t('largestDropOff')}
              value={`${formatPercentage(100 * funnel.biggestDropOff.dropoffRatio)}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type InlineDataDisplayProps = {
  title: ReactNode;
  value: ReactNode;
};

function InlineDataDisplay({ title, value }: InlineDataDisplayProps) {
  return (
    <div className='grid grid-cols-3 items-center rounded-md border-1 px-2 align-middle shadow md:place-items-center'>
      <h4 className='text-muted-foreground col-span-2 ml-4 text-sm md:ml-0'>{title}:</h4>
      <p className='font-semibold'>{value}</p>
    </div>
  );
}
