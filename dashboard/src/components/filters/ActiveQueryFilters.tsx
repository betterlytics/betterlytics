'use client';
import { useRef } from 'react';
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

  // Pills present on first render (e.g. from the URL) must not replay the entrance pulse.
  const initialIdsRef = useRef<Set<string> | null>(null);
  const initialIds = (initialIdsRef.current ??= new Set(queryFilters.map((filter) => filter.id)));

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
              'border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 max-w-full gap-1.5 p-1 px-1.5',
              !initialIds.has(filter.id) && 'animate-filter-pill-added',
              status.disabled && 'opacity-50',
            )}
          >
            <DisabledTooltip
              disabled={status.disabled}
              message={disabledMessage}
              wrapperClassName='inline-flex min-w-0'
            >
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
