'use client';

import { useMemo } from 'react';
import { FilterIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterDescription } from '@/components/filters/FilterDescription';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useAllowedStepFilters } from '@/hooks/use-is-filter-column-allowed';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { cn } from '@/lib/utils';
import { getStepBandCells } from './bandGeometry';
import { UserJourneyStepFilterPopover } from './UserJourneyStepFilterPopover';

export function UserJourneyStepBand() {
  const t = useTranslations('components.userJourney');
  const { numberOfSteps, stepFilters } = useUserJourneyFilter();
  const allowedStepFilters = useAllowedStepFilters(stepFilters, numberOfSteps);
  const cells = useMemo(() => getStepBandCells(numberOfSteps), [numberOfSteps]);

  return (
    <div
      className='bg-card sticky top-0 z-20 flex w-full border-b'
      role='group'
      aria-label={t('stepFilterBandLabel')}
    >
      <div style={{ width: `${cells[0].left}%` }} />
      {cells.map((cell, slot) => {
        const activeFilters = filterEmptyQueryFilters(allowedStepFilters[slot] ?? []);
        const count = activeFilters.length;
        const align = slot >= numberOfSteps - 2 ? 'end' : 'start';

        return (
          <div
            key={slot}
            style={{ width: `${cell.width}%` }}
            className='flex min-w-0 items-center gap-1 border-r px-2 py-1.5 last:border-r-0'
          >
            <span className='text-muted-foreground truncate text-xs font-medium'>
              {t('stepLabel', { number: slot + 1 })}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <UserJourneyStepFilterPopover
                    slot={slot}
                    lastSlot={numberOfSteps - 1}
                    align={align}
                    trigger={
                      <Button
                        variant='ghost'
                        size='sm'
                        className={cn(
                          'h-7 cursor-pointer gap-1.5 px-2 text-xs data-[state=open]:bg-accent/60 data-[state=open]:text-foreground',
                          count > 0 ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        <FilterIcon className='size-3.5' />
                        <span>{t('filterTrigger')}</span>
                        {count > 0 && (
                          <Badge className='h-4.5 min-w-4.5 rounded-full px-1 text-[11px] tabular-nums'>
                            {count}
                          </Badge>
                        )}
                      </Button>
                    }
                  />
                </span>
              </TooltipTrigger>
              {count > 0 && (
                <TooltipContent side='bottom' className='flex max-w-xs flex-col gap-1'>
                  {activeFilters.map((filter) => (
                    <FilterDescription
                      key={filter.id}
                      filter={filter}
                      className='[&_[data-operator]]:text-current'
                      columnClassName='[&_svg]:text-current'
                    />
                  ))}
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
