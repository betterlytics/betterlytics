'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useFilterColumnStatus, useFilterColumnDisabledMessage } from '@/hooks/use-is-filter-column-allowed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilterDescription } from '@/components/filters/FilterDescription';
import { cn } from '@/lib/utils';

export function ActiveQueryFilters() {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();
  const t = useTranslations('components.filters');
  const getColumnStatus = useFilterColumnStatus();
  const getDisabledMessage = useFilterColumnDisabledMessage();

  if (queryFilters.length === 0) {
    return null;
  }
  return (
    <div className='flex flex-wrap gap-1 sm:justify-end'>
      {queryFilters.map((filter) => {
        const status = getColumnStatus(filter.column);
        const disabledMessage = getDisabledMessage(status);
        return (
          <Badge
            key={filter.id}
            variant='outline'
            className={cn(
              'border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 gap-1.5 p-1 px-1.5',
              status.disabled && 'opacity-50',
            )}
          >
            <DisabledTooltip disabled={status.disabled} message={disabledMessage} wrapperClassName='inline-flex'>
              {() => <FilterDescription filter={filter} />}
            </DisabledTooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  aria-label={t('removeFilter')}
                  className='text-muted-foreground/80 hover:text-foreground focus-visible:text-foreground -mx-0.5 size-6 cursor-pointer'
                  onClick={() => removeQueryFilter(filter.id)}
                >
                  <XIcon className='size-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('removeFilter')}</TooltipContent>
            </Tooltip>
          </Badge>
        );
      })}
    </div>
  );
}
