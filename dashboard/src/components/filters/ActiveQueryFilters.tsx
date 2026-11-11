'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ChevronDown, FilterIcon, Trash2, XIcon } from 'lucide-react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useQueryFiltersEditor, type QueryFilterPart } from '@/contexts/QueryFiltersEditorProvider';
import { useFilterColumnStatus, useFilterColumnDisabledMessage } from '@/hooks/use-is-filter-column-allowed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { FilterColumnLabel } from '@/components/filters/FilterColumnLabel';
import { FilterPillSection } from '@/components/filters/FilterPillSection';
import { FilterPillTooltip } from '@/components/filters/FilterPillTooltip';
import { FilterPillValues } from '@/components/filters/FilterPillValues';
import { useNotifyFiltersUpdated } from '@/components/filters/filtersUpdatedToast';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { cn } from '@/lib/utils';

// One opaque pill colour, so the values' "+N more" label and fade can cover text in exactly that colour.
const pillBackground = cn(
  'bg-(--pill-bg) [--pill-bg:color-mix(in_oklab,var(--muted)_50%,var(--background))] [--pill-bg-hover:var(--muted)]',
  'dark:[--pill-bg:var(--secondary)] dark:[--pill-bg-hover:color-mix(in_oklab,var(--input)_50%,var(--secondary))]',
);

type ActiveQueryFiltersProps = {
  // 'band' is the pinned one-row version under the topbar
  variant?: 'row' | 'band';
};

export function ActiveQueryFilters({ variant = 'row' }: ActiveQueryFiltersProps) {
  const { queryFilters, removeQueryFilter, setQueryFilters } = useQueryFiltersContext();
  const { openEditor } = useQueryFiltersEditor();
  const t = useTranslations('components.filters');
  const getColumnStatus = useFilterColumnStatus();
  const getDisabledMessage = useFilterColumnDisabledMessage();
  const notifyFiltersUpdated = useNotifyFiltersUpdated();
  const band = variant === 'band';

  // Pills present on first render (e.g. from the URL) must not replay the entrance pulse.
  const initialIdsRef = useRef<Set<string> | null>(null);
  const initialIds = (initialIdsRef.current ??= new Set(queryFilters.map((filter) => filter.id)));

  if (queryFilters.length === 0) {
    return null;
  }

  // Keeps focus off <body> once the pills unmount
  const focusFiltersTrigger = (from: HTMLElement) =>
    from
      .closest('[data-slot=dashboard-filters]')
      ?.querySelector<HTMLElement>('[data-query-filters-trigger]')
      ?.focus({ preventScroll: true });

  const clearAll = (event: MouseEvent<HTMLElement>) => {
    focusFiltersTrigger(event.currentTarget);
    setQueryFilters([]);
    notifyFiltersUpdated(queryFilters, []);
  };

  const pills = queryFilters.map((filter) => {
    const status = getColumnStatus(filter.column);
    const disabledMessage = getDisabledMessage(status);
    const operator = filter.operator === '=' ? t('is') : t('isNot');
    const openPart = (part: QueryFilterPart) => () => openEditor({ filterId: filter.id, part });

    const sections = (
      <span className='divide-input inline-flex min-w-0 items-stretch divide-x'>
        <FilterPillSection className='max-w-48 shrink-0' data-pill-part='column' onClick={openPart('column')}>
          <FilterColumnLabel column={filter.column} className='min-w-0 [&_svg]:size-3' />
        </FilterPillSection>
        <FilterPillSection
          className='text-muted-foreground/80 shrink-0'
          data-pill-part='operator'
          onClick={openPart('operator')}
        >
          {operator}
        </FilterPillSection>
        <FilterPillValues filter={filter} onOpen={openEditor} />
      </span>
    );

    return (
      <FilterPillTooltip key={filter.id} filter={filter} disabled={status.disabled}>
        <Badge
          data-filter-pill={filter.id}
          variant='outline'
          className={cn(
            'border-input divide-input min-w-0 items-stretch gap-0 divide-x p-0 font-sans',
            band
              ? 'max-w-full shrink-0 dark:[--ring:var(--primary-foreground)]'
              : 'max-w-max shrink grow basis-80',
            pillBackground,
            !initialIds.has(filter.id) && (band ? 'animate-filter-pill-in' : 'animate-filter-pill-added'),
            status.disabled && 'opacity-50',
          )}
        >
          {status.disabled ? (
            <DisabledTooltip disabled message={disabledMessage} wrapperClassName='inline-flex min-w-0'>
              {() => sections}
            </DisabledTooltip>
          ) : (
            sections
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                data-pill-remove=''
                aria-label={t('removeFilter')}
                className='text-muted-foreground/80 hover:text-foreground focus-visible:text-foreground size-8 shrink-0 cursor-pointer rounded-none focus-visible:ring-inset'
                onClick={(event) => {
                  if (queryFilters.length === 1) focusFiltersTrigger(event.currentTarget);
                  removeQueryFilter(filter.id);
                }}
              >
                <XIcon className='size-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('removeFilter')}</TooltipContent>
          </Tooltip>
        </Badge>
      </FilterPillTooltip>
    );
  });

  if (!band) {
    return <div className='flex flex-wrap gap-1 sm:justify-end'>{pills}</div>;
  }

  return <FilterBand pills={pills} filters={queryFilters} label={t('activeFilters')} onClearAll={clearAll} />;
}

type FilterBandProps = {
  pills: ReactNode[];
  // Changes only when the filters do, unlike the pills
  filters: QueryFilter[];
  label: string;
  onClearAll: MouseEventHandler<HTMLElement>;
};

const PEEK_MIN_WIDTH = 40;

/*
 * Pills always wrap at one width, so none moves on toggle: collapsed is the same list clipped to row one.
 * The space left on that row shows a faded peek, an inert copy of the next pill.
 */
function FilterBand({ pills, filters, label, onClearAll }: FilterBandProps) {
  const t = useTranslations('components.filters');
  const bandRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number | null>(null);
  const wrappedAtRef = useRef(-Infinity);
  const [hidden, setHidden] = useState(0);
  const [peekLeft, setPeekLeft] = useState<number | null>(null);
  const [state, setState] = useState<'collapsed' | 'expanded' | 'collapsing'>('collapsed');
  const count = pills.length;
  const expanded = state === 'expanded';
  // Stays open until the collapse slide has finished
  const open = state !== 'collapsed';

  const measure = useCallback(() => {
    const band = bandRef.current;
    const row = rowRef.current;
    const items = row ? [...row.querySelectorAll<HTMLElement>(':scope > [data-filter-pill]')] : [];
    if (!band || !row || items.length === 0) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const top = items[0].offsetTop;
    let first = items.findIndex((item) => item.offsetTop > top);
    const toggle = toggleRef.current;
    if (!toggle) {
      if (first >= 0) wrappedAtRef.current = band.clientWidth;
    } else if (first >= 0) {
      /*
       * The toggle narrows the row, so only the pill widths can say whether it is still needed. Squeezed pills
       * and a band width that already wrapped are ruled out, or the two layouts flip forever.
       */
      const content = row.getBoundingClientRect().width;
      const widths = items.map((item) => item.getBoundingClientRect().width);
      const spare =
        toggle.getBoundingClientRect().width - (toggle.lastElementChild?.getBoundingClientRect().width ?? 0);
      const needed = widths.reduce((sum, width) => sum + width, 0) + gap * (items.length - 1);
      const squeezed = widths.some((width) => width >= content - 0.5);
      if (!squeezed && needed <= content + spare - 0.5 && band.clientWidth > wrappedAtRef.current) first = -1;
    }
    items.forEach((item, index) => {
      item.toggleAttribute('inert', !open && first >= 0 && index >= first);
      // Keeps the band's title off live controls
      item
        .querySelectorAll('[data-pill-part]:not([title]), [data-pill-remove]:not([title])')
        .forEach((section) => section.setAttribute('title', ''));
    });
    setHidden(first < 0 ? 0 : count - first);
    if (first < 0) {
      setPeekLeft(null);
      if (open) setState('collapsed');
      return;
    }
    const last = items[first - 1];
    const left = last.offsetLeft + last.offsetWidth + gap;
    setPeekLeft(row.clientWidth - left >= PEEK_MIN_WIDTH ? left : null);
  }, [count, open]);

  // Changed pills void the wrap history
  useLayoutEffect(() => {
    wrappedAtRef.current = -Infinity;
  }, [filters]);

  useLayoutEffect(measure);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(row);
    row.querySelectorAll(':scope > [data-filter-pill]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [measure, filters]);

  // Height slide with the accordion's timing
  useLayoutEffect(() => {
    const band = bandRef.current;
    const pill = rowRef.current?.querySelector<HTMLElement>('[data-filter-pill]');
    if (state === 'collapsed' || !band || !pill) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (state === 'collapsing') setState('collapsed');
      return;
    }
    const { paddingTop, paddingBottom } = getComputedStyle(band);
    const single = pill.offsetHeight + parseFloat(paddingTop) + parseFloat(paddingBottom);
    const full = band.offsetHeight;
    const to = state === 'expanded' ? full : single;
    const from = heightRef.current ?? (state === 'expanded' ? single : full);
    band.style.overflow = 'clip';
    const animation = band.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 200,
      easing: 'ease-out',
      fill: state === 'collapsing' ? 'forwards' : 'none',
    });
    animation.onfinish = () => {
      if (state === 'collapsing') setState('collapsed');
      else band.style.overflow = '';
    };
    return () => {
      heightRef.current = band.getBoundingClientRect().height;
      animation.cancel();
      band.style.overflow = '';
    };
  }, [state]);

  // Outside click or Escape collapses, except from the filter editor
  useEffect(() => {
    if (!expanded) return;
    const band = bandRef.current;
    const inEditor = (target: EventTarget | null) =>
      target instanceof Element && target.closest('[data-radix-popper-content-wrapper], [role=dialog]') !== null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !band?.contains(event.target) && !inEditor(event.target))
        setState('collapsing');
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || inEditor(event.target)) return;
      const focused = document.activeElement;
      const top = rowRef.current?.querySelector<HTMLElement>('[data-filter-pill]')?.offsetTop;
      const staysInView = focused?.closest<HTMLElement>('[data-filter-pill]')?.offsetTop === top;
      // Focus on a control that is about to leave moves to the chevron
      if (band?.contains(focused) && !staysInView)
        band.querySelector<HTMLElement>('[data-band-toggle]')?.focus({ preventScroll: true });
      setState('collapsing');
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const toggleable = hidden > 0;

  const toggle = () => setState(expanded ? 'collapsing' : 'expanded');

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
