'use client';

import { useMemo } from 'react';
import { ChevronDownIcon, FilterIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useAllowedStepFilters } from '@/hooks/use-is-filter-column-allowed';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { cn } from '@/lib/utils';
import { getStepBandGeometry } from './bandGeometry';
import { UserJourneyStepFilterPopover } from './UserJourneyStepFilterPopover';

export function UserJourneyStepBand() {
  const t = useTranslations('components.userJourney');
  const { numberOfSteps, stepFilters } = useUserJourneyFilter();
  const allowedStepFilters = useAllowedStepFilters(stepFilters, numberOfSteps);
  const { left, width, cells } = useMemo(() => getStepBandGeometry(numberOfSteps), [numberOfSteps]);

  return (
    <div
      style={{ marginLeft: `${left}%`, width: `${width}%` }}
      className='bg-card sticky top-0 z-20 mt-1 flex rounded-md border'
      role='group'
      aria-label={t('stepFilterBandLabel')}
    >
      {cells.map((cell, slot) => {
        const count = filterEmptyQueryFilters(allowedStepFilters[slot] ?? []).length;
        const align = slot >= numberOfSteps - 2 ? 'end' : 'start';

        return (
          <div key={slot} style={{ width: `${cell.width}%` }} className='min-w-0 border-r last:border-r-0'>
            <UserJourneyStepFilterPopover
              slot={slot}
              lastSlot={numberOfSteps - 1}
              align={align}
              trigger={
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'group h-auto w-full cursor-pointer justify-between gap-1.5 rounded-none px-2 py-1.5 text-xs',
                    slot === 0 && 'rounded-l-[calc(var(--radius-md)-1px)]',
                    slot === numberOfSteps - 1 && 'rounded-r-[calc(var(--radius-md)-1px)]',
                  )}
                >
                  <span className='flex min-w-0 items-center gap-1.5'>
                    <Badge variant='outline' className='rounded-sm px-1.5 text-[11px] font-medium text-current'>
                      {t('stepLabel', { number: slot + 1 })}
                    </Badge>
                    <FilterIcon className='size-3.5 shrink-0' />
                    <span className='truncate'>{t('filterTrigger')}</span>
                    {count > 0 && (
                      <Badge variant='default' className='h-4.5 min-w-4.5 rounded-full px-1 text-[11px] tabular-nums'>
                        {count}
                      </Badge>
                    )}
                  </span>
                  <ChevronDownIcon className='size-3.5 shrink-0 opacity-50 transition-transform group-data-[state=open]:rotate-180' />
                </Button>
              }
            />
          </div>
        );
      })}
    </div>
  );
}
