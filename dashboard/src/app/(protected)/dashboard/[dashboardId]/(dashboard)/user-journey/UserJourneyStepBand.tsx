'use client';

import { FilterIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterDescription } from '@/components/filters/FilterDescription';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { cn } from '@/lib/utils';
import { getStepBandCells } from './stepBandGeometry';
import { UserJourneyStepFilterPopover } from './UserJourneyStepFilterPopover';

type UserJourneyStepBandProps = {
  renderedColumnCount: number;
};

export function UserJourneyStepBand({ renderedColumnCount }: UserJourneyStepBandProps) {
  const { numberOfSteps, stepFilters } = useUserJourneyFilter();
  const t = useTranslations('components.userJourney');

  const cellCount = numberOfSteps + 1;
  const cells = getStepBandCells(cellCount, renderedColumnCount === cellCount);

  return (
    <div role='group' className='bg-card sticky top-0 z-20 h-12 border-b' aria-label={t('stepBandLabel')}>
      <div className='relative mx-4 h-full'>
        {cells.map((cell, position) => {
          const filters = stepFilters[position] ?? [];
          const isActive = filters.length > 0;
          return (
            <div
              key={position}
              className={cn('absolute inset-y-0 flex items-center gap-2 px-3', position > 0 && 'border-l')}
              style={{ left: `${cell.left * 100}%`, width: `${cell.width * 100}%` }}
            >
              <span className='text-[13px] font-bold whitespace-nowrap'>{t('step', { step: position + 1 })}</span>
              <UserJourneyStepFilterPopover
                position={position}
                align={position >= cellCount - 2 ? 'end' : 'start'}
                triggerSummary={
                  isActive ? (
                    <div className='flex flex-col items-start gap-1'>
                      {filters.map((filter) => (
                        <FilterDescription key={filter.id} filter={filter} />
                      ))}
                    </div>
                  ) : undefined
                }
                trigger={
                  <Button
                    variant='outline'
                    size='sm'
                    className={cn(
                      'h-7 cursor-pointer gap-1.5 px-2 text-xs',
                      isActive ? 'border-primary/50 text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <FilterIcon className='size-3.5' />
                    {isActive ? (
                      <Badge variant='secondary' className='h-5 px-2 text-xs font-medium'>
                        {filters.length}
                      </Badge>
                    ) : (
                      <span>{t('filter')}</span>
                    )}
                  </Button>
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
