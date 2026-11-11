'use client';
import { useRef, type MouseEvent, type MouseEventHandler, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, FilterIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { useFilterBandDisclosure } from '@/hooks/use-filter-band-disclosure';
import { useFilterBandOverflow } from '@/hooks/use-filter-band-overflow';
import { cn } from '@/lib/utils';

type FilterBandProps = {
  pills: ReactNode[];
  // Any value that changes exactly when the pills do
  pillsKey: unknown;
  label: string;
  onClearAll: MouseEventHandler<HTMLElement>;
};

/*
 * Pills always wrap at one width, so none moves on toggle: collapsed is the same list clipped to row one.
 * The space left on that row shows a faded peek, an inert copy of the next pill.
 */
export function FilterBand({ pills, pillsKey, label, onClearAll }: FilterBandProps) {
  const t = useTranslations('components.filters');
  const bandRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const count = pills.length;
  const { expanded, open, toggle, reset } = useFilterBandDisclosure(bandRef);
  const { hidden, peekLeft } = useFilterBandOverflow({
    bandRef,
    rowRef,
    toggleRef,
    pillsKey,
    count,
    open,
    onFits: reset,
  });
  const toggleable = hidden > 0;

  // Anywhere but a live control toggles the band
  const handleBandClick = (event: MouseEvent<HTMLElement>) => {
    if (!toggleable) return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    toggle();
  };

  const clearAllButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          title=''
          aria-label={t('clearAll')}
          className='text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground dark:hover:bg-primary-foreground/15 size-8.5 shrink-0 cursor-pointer'
          onClick={onClearAll}
        >
          <Trash2 className='size-4' />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('clearAll')}</TooltipContent>
    </Tooltip>
  );

  return (
    <div
      ref={bandRef}
      data-slot='active-filters-band'
      role='group'
      aria-label={label}
      title={toggleable ? t('toggleFilters') : undefined}
      tabIndex={-1}
      onClick={handleBandClick}
      className={cn(
        'text-primary-foreground flex min-w-0 items-start gap-2 rounded-lg bg-(--band-bg) p-1 pl-3 shadow-md transition-[opacity,translate,--band-bg] duration-200 ease-out outline-none [--band-bg:var(--primary)] motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0',
        toggleable &&
          'cursor-pointer hover:not-has-[button:not([data-band-toggle]):hover]:[--band-bg:color-mix(in_oklab,var(--primary)_85%,var(--primary-foreground))]',
      )}
    >
      <span className='relative flex h-8.5 shrink-0 items-center pr-1.5'>
        <FilterIcon aria-hidden className='size-4' />
        <span
          aria-hidden
          className='bg-primary-foreground text-primary absolute right-0 bottom-1 grid h-3.5 min-w-3.5 place-items-center rounded-full px-0.5 text-[10px] leading-none font-semibold tabular-nums select-none'
        >
          {count}
        </span>
      </span>
      <div
        ref={rowRef}
        className={cn(
          'relative flex min-w-0 flex-1 flex-wrap gap-1 [&>[data-filter-pill]]:max-w-[min(20rem,100%)]',
          !open && 'h-8.5 overflow-clip',
        )}
      >
        {pills}
        {toggleable && peekLeft !== null && (
          <div
            aria-hidden
            inert
            style={{ left: peekLeft }}
            className={cn(
              'absolute top-0 right-0 flex h-8.5 overflow-clip transition-opacity duration-200 motion-reduce:transition-none',
              '[&_[data-filter-pill]]:max-w-80 [&_[data-filter-pill]]:animate-none',
              // Inside the peek, so fade and pill dim as one
              'after:absolute after:inset-y-0 after:right-0 after:w-6 after:bg-linear-to-r after:from-transparent after:to-(--band-bg) sm:after:w-10',
              expanded && 'opacity-0',
            )}
          >
            {pills[count - hidden]}
          </div>
        )}
        {/* Phones have no "+N more", so a bare fade marks the overflow */}
        {toggleable && peekLeft === null && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-0 right-0 h-8.5 w-6 bg-linear-to-r from-transparent to-(--band-bg) transition-opacity duration-200 motion-reduce:transition-none sm:hidden',
              expanded && 'opacity-0',
            )}
          />
        )}
      </div>
      <div className='flex shrink-0 flex-col items-end justify-between gap-1 self-stretch [--ring:var(--primary-foreground)]'>
        {toggleable ? (
          <div ref={toggleRef} className='flex h-8.5 items-center'>
            <span
              aria-hidden={expanded}
              className={cn(
                'text-xs font-medium whitespace-nowrap tabular-nums transition-opacity duration-200 motion-reduce:transition-none max-sm:hidden',
                expanded && 'opacity-0',
              )}
            >
              {t('pillMoreValues', { count: hidden })}
            </span>
            <button
              type='button'
              data-band-toggle=''
              aria-expanded={expanded}
              aria-label={t('toggleFilters')}
              onClick={toggle}
              className='group/toggle grid size-8.5 cursor-pointer place-items-center outline-none'
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-4 rounded-md transition-transform duration-200 motion-reduce:transition-none',
                  expanded && 'rotate-180',
                  'group-focus-visible/toggle:ring-ring/50 group-focus-visible/toggle:ring-2',
                  'group-focus-visible/toggle:border-ring group-focus-visible/toggle:border',
                )}
              />
            </button>
          </div>
        ) : (
          clearAllButton
        )}
        {toggleable && open && clearAllButton}
      </div>
    </div>
  );
}
