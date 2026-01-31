'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Badge } from '../ui/badge';
import { XIcon } from 'lucide-react';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useIsTablet } from '@/hooks/use-is-tablet';

const MAX_VISIBLE_TABLET = 2;
const MAX_VISIBLE_DESKTOP = 3;

interface ActiveQueryFiltersProps {
  inline?: boolean;
  className?: string;
}

export function ActiveQueryFilters({ inline = false, className }: ActiveQueryFiltersProps) {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();
  const t = useTranslations('components.filters');
  const isTablet = useIsTablet();

  if (queryFilters.length === 0) {
    return null;
  }

  const maxVisible = isTablet ? MAX_VISIBLE_TABLET : MAX_VISIBLE_DESKTOP;
  const visibleCount = inline ? Math.min(maxVisible, queryFilters.length) : queryFilters.length;
  const visibleFilters = queryFilters.slice(0, visibleCount);
  const hiddenFilters = queryFilters.slice(visibleCount);
  const hiddenCount = hiddenFilters.length;

  const badgeClassName =
    'text-muted-foreground border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 shrink-0 max-w-40 px-2 py-1';

  return (
    <div className={cn('flex gap-1', inline ? 'min-w-0 flex-nowrap' : 'flex-wrap sm:justify-end', className)}>
      {visibleFilters.map((filter) => (
        <Badge key={filter.id} variant='outline' className={badgeClassName}>
          <span className='truncate'>{formatQueryFilter(filter, t)}</span>
          <button
            className='mt-0.5 size-3.5 shrink-0 cursor-pointer opacity-80 hover:opacity-100'
            onClick={() => removeQueryFilter(filter.id)}
          >
            <XIcon className='size-full' />
          </button>
        </Badge>
      ))}

      {hiddenCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant='outline'
              className='text-muted-foreground border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 shrink-0 cursor-pointer px-2 py-1'
            >
              +{hiddenCount}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className='w-auto max-w-[300px] p-2' align='end'>
            <div className='flex flex-col gap-1'>
              {hiddenFilters.map((filter) => (
                <div
                  key={filter.id}
                  className='bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm'
                >
                  <span className='text-muted-foreground truncate'>{formatQueryFilter(filter, t)}</span>
                  <button
                    className='text-muted-foreground hover:text-foreground shrink-0 cursor-pointer opacity-80 hover:opacity-100'
                    onClick={() => removeQueryFilter(filter.id)}
                  >
                    <XIcon className='size-4' />
                  </button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
