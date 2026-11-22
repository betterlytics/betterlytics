'use client';
import { useRef, type MouseEvent, type MouseEventHandler, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, FilterIcon, Trash2 } from 'lucide-react';
import { FilterBandButton } from '@/components/filters/FilterBandButton';
import { useFilterBandDisclosure } from '@/hooks/use-filter-band-disclosure';
import { useFilterBandOverflow } from '@/hooks/use-filter-band-overflow';
import { cn } from '@/lib/utils';

type FilterBandProps = {
  pills: ReactNode[];
  // Any value that changes exactly when the pills do
  pillsKey: unknown;
  label: string;
  onClearAll: MouseEventHandler<HTMLElement>;
  editorOpen: boolean;
  onToggleEditor: () => void;
  // Kept on row one, ahead of the toggle
  action?: ReactNode;
};

// Each surface fades its own colour: an inherited variable would restyle every pill per frame
const BAND_SURFACE =
  'transition-colors duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:[[data-slot=active-filters-band]:hover:not(:has(button:not([data-band-toggle]):hover))_&]:bg-(--band-hover)';

/*
 * Pills always wrap at one width, so none moves on toggle: collapsed is the same list clipped to row one.
 * The space left on that row shows a faded peek, an inert copy of the next pill.
 */
export function FilterBand({
  pills,
  pillsKey,
  label,
  onClearAll,
  editorOpen,
  onToggleEditor,
  action,
}: FilterBandProps) {
  const t = useTranslations('components.filters');
  const bandRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLSpanElement>(null);
  const count = pills.length;
  const { expanded, open, toggle, reset } = useFilterBandDisclosure(bandRef);
  const { hidden, peekLeft, fades } = useFilterBandOverflow({
    rowRef,
    coverRef,
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

  const clearAllButton = <FilterBandButton icon={<Trash2 />} tooltip={t('clearAll')} onClick={onClearAll} />;

  const cover = (
    <span
      ref={coverRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0 right-0 flex h-8.5',
        !fades && 'invisible',
        // Within the peek it dims with the peek instead
        peekLeft === null && 'transition-opacity duration-200 motion-reduce:transition-none',
        peekLeft === null && expanded && 'opacity-0',
      )}
    >
      <span
        className={cn(
          'bg-primary w-6 [mask-image:linear-gradient(to_right,transparent,black)] sm:w-8',
          BAND_SURFACE,
        )}
      />
      <span
        className={cn(
          'bg-primary flex items-center px-1.25 text-xs font-medium whitespace-nowrap tabular-nums max-sm:hidden',
          BAND_SURFACE,
        )}
      >
        {t('pillMoreValues', { count: hidden })}
      </span>
    </span>
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
        'bg-primary text-primary-foreground flex min-w-0 items-start rounded-lg p-1 shadow-md transition-[opacity,translate,background-color] duration-200 ease-out outline-none motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0',
        '[--band-hover:color-mix(in_oklab,var(--primary)_85%,var(--primary-foreground))]',
        toggleable && 'cursor-pointer hover:not-has-[button:not([data-band-toggle]):hover]:bg-(--band-hover)',
      )}
    >
      <FilterBandButton
        data-band-editor=''
        className='relative mr-1'
        title={t('editFilters')}
        aria-label={t('editFilters')}
        aria-haspopup='dialog'
        aria-expanded={editorOpen}
        onClick={onToggleEditor}
        icon={
          <>
            <FilterIcon />
            <span
              aria-hidden
              className='bg-primary-foreground text-primary absolute right-1 bottom-1 grid h-3 min-w-3 place-items-center rounded-full px-0.5 text-[10px] leading-none font-semibold tabular-nums select-none'
            >
              {count}
            </span>
          </>
        }
      />
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
              expanded && 'opacity-0',
            )}
          >
            {pills[count - hidden]}
            {cover}
          </div>
        )}
        {toggleable && peekLeft === null && cover}
      </div>
      <div className='ml-0.75 flex shrink-0 flex-col items-end justify-between gap-1 self-stretch [--ring:var(--primary-foreground)]'>
        <div className='flex items-center'>
          {action}
          {toggleable ? (
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
          ) : (
            clearAllButton
          )}
        </div>
        {toggleable && open && clearAllButton}
      </div>
    </div>
  );
}
