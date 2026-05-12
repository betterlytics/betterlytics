'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilterDescription } from '@/components/filters/FilterDescription';

export function ActiveQueryFilters() {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();
  const t = useTranslations('components.filters');

  if (queryFilters.length === 0) {
    return null;
  }
  return (
    <div className='flex flex-wrap gap-1 sm:justify-end'>
      {queryFilters.map((filter) => (
        <Badge
          key={filter.id}
          variant='outline'
          className='gap-1.5 border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 p-1 px-1.5'
        >
          <FilterDescription filter={filter} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                aria-label={t('removeFilter')}
                className='text-muted-foreground/80 size-6 cursor-pointer hover:text-foreground focus-visible:text-foreground -mx-0.5'
                onClick={() => removeQueryFilter(filter.id)}
              >
                <XIcon className='size-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('removeFilter')}</TooltipContent>
          </Tooltip>
        </Badge>
      ))}
    </div>
  );
}
