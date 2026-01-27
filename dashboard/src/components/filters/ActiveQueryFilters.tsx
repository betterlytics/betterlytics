'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Badge } from '../ui/badge';
import { XIcon } from 'lucide-react';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';
import { useTranslations } from 'next-intl';
import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const BADGE_GAP = 4;
const OVERFLOW_BADGE_WIDTH = 36;

interface ActiveQueryFiltersProps {
  inline?: boolean;
  maxWidth?: number;
}

export function ActiveQueryFilters({ inline = false, maxWidth }: ActiveQueryFiltersProps) {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();
  const t = useTranslations('components.filters');
  const containerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(queryFilters.length);

  const calculateVisibleCount = useCallback(() => {
    if (!inline || !measureContainerRef.current) {
      setVisibleCount(queryFilters.length);
      return;
    }

    const availableWidth = maxWidth ?? containerRef.current?.offsetWidth ?? Infinity;
    const badges = measureContainerRef.current.children;

    const badgeWidths = Array.from(badges, (b) => (b as HTMLElement).getBoundingClientRect().width);

    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < badgeWidths.length; i++) {
      const remainingFilters = badgeWidths.length - i - 1;
      const reservedWidth = remainingFilters > 0 ? OVERFLOW_BADGE_WIDTH + BADGE_GAP : 0;

      if (usedWidth + badgeWidths[i] + reservedWidth <= availableWidth) {
        usedWidth += badgeWidths[i] + BADGE_GAP;
        count++;
      } else {
        break;
      }
    }

    setVisibleCount(count);
  }, [inline, queryFilters.length, maxWidth]);

  useLayoutEffect(() => {
    const calculate = () => requestAnimationFrame(calculateVisibleCount);

    document.fonts?.ready?.then(calculate) ?? calculate();

    return undefined;
  }, [calculateVisibleCount]);

  if (queryFilters.length === 0) {
    return null;
  }

  const visibleFilters = inline ? queryFilters.slice(0, visibleCount) : queryFilters;
  const hiddenFilters = inline ? queryFilters.slice(visibleCount) : [];
  const hiddenCount = hiddenFilters.length;

  const badgeClassName =
    'text-muted-foreground border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 shrink-0 whitespace-nowrap px-2 py-1';

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-nowrap gap-1 overflow-hidden ${inline ? 'min-w-0' : 'flex-wrap sm:justify-end'}`}
    >
      {/* Hidden container for measuring width */}
      {inline && (
        <div
          ref={measureContainerRef}
          className='pointer-events-none invisible absolute top-0 left-0 flex gap-1'
          aria-hidden='true'
        >
          {queryFilters.map((filter) => (
            <Badge key={`measure-${filter.id}`} variant='outline' className={badgeClassName}>
              {formatQueryFilter(filter, t)}
              <div className='mt-0.5 size-3.5' />
            </Badge>
          ))}
        </div>
      )}

      {visibleFilters.map((filter) => (
        <Badge key={filter.id} variant='outline' className={badgeClassName}>
          {formatQueryFilter(filter, t)}
          <div
            className='mt-0.5 size-3.5 shrink-0 cursor-pointer opacity-80 hover:opacity-100'
            onClick={() => removeQueryFilter(filter.id)}
          >
            <XIcon className='size-full' />
          </div>
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
          <PopoverContent className='w-auto max-w-[300px] p-2' align='start'>
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
