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
import { cn } from '@/lib/utils';

// One opaque pill colour, so the values' "+N more" label and fade can cover text in exactly that colour.
const pillBackground = cn(
  'bg-(--pill-bg) [--pill-bg:color-mix(in_oklab,var(--muted)_50%,var(--background))] [--pill-bg-hover:var(--muted)]',
  'dark:[--pill-bg:var(--secondary)] dark:[--pill-bg-hover:color-mix(in_oklab,var(--input)_50%,var(--secondary))]',
);

type ActiveQueryFiltersProps = {
  // The band is the one-row version shown under the topbar once the filters have scrolled out of view.
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

  // The pills unmount once they empty, so focus goes to the Filters button instead of falling to <body>.
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
            !initialIds.has(filter.id) && 'animate-filter-pill-added',
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

  return <FilterBand pills={pills} label={t('activeFilters')} onClearAll={clearAll} />;
}

type FilterBandProps = { pills: ReactNode[]; label: string; onClearAll: MouseEventHandler<HTMLElement> };

/*
 * One row of pills at their natural width, clipped at the edge, with the cut faded under "+N more". The band only
 * exists after scrolling, so it is never server rendered and the count is simply measured. While something is
 * hidden, a click anywhere but a live control toggles the band open and shut; clearing all is offered once every pill
 * shows.
 */
function FilterBand({ pills, label, onClearAll }: FilterBandProps) {
  const t = useTranslations('components.filters');
  const bandRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number | null>(null);
  const [hidden, setHidden] = useState(0);
  const [state, setState] = useState<'collapsed' | 'expanded' | 'collapsing'>('collapsed');
  const count = pills.length;
  const expanded = state === 'expanded';
  // The pills stay wrapped while the band slides shut, so the rows leave under the closing edge.
  const wrapped = state !== 'collapsed';

  /*
   * A pill counts as hidden once its end passes the middle of the fade before "+N more". Past that point everything
   * is inert, down to the sections of the cut pill, so clicks there fall through to the band and expand it.
   */
  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const items = [...row.querySelectorAll<HTMLElement>(':scope > [data-filter-pill]')];
    const more = row.parentElement?.querySelector<HTMLElement>('[data-band-more]');
    const edge = more
      ? more.getBoundingClientRect().left - parseFloat(getComputedStyle(more, '::before').width) / 2
      : row.getBoundingClientRect().right;
    const past = (element: Element) => element.getBoundingClientRect().right > edge + 0.5;
    const first = wrapped ? -1 : items.findIndex(past);
    items.forEach((item, index) => {
      item.toggleAttribute('inert', first >= 0 && index > first);
      item.toggleAttribute('data-no-tooltip', index === first);
      item.querySelectorAll('[data-pill-part], [data-pill-remove]').forEach((section) => {
        section.toggleAttribute('inert', index === first && past(section));
        // An empty title keeps the band's toggle title off the live controls.
        section.setAttribute('title', '');
      });
    });
    if (!wrapped) setHidden(first < 0 ? 0 : count - first);
  }, [count, wrapped]);

  useLayoutEffect(measure);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || wrapped) return;
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(row);
    row.querySelectorAll(':scope > [data-filter-pill]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [measure, pills, wrapped]);

  // Slides the band between one row and all of them, with the timing of the accordion animations.
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

  // Collapses on a click elsewhere or Escape, but not from inside the filter editor a pill opened.
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
      if (event.key === 'Escape' && !inEditor(event.target)) setState('collapsing');
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const expand = () => {
    const firstHidden = count - hidden;
    flushSync(() => setState('expanded'));
    rowRef.current
      ?.querySelectorAll('[data-filter-pill]')
      [firstHidden]?.querySelector<HTMLElement>('[data-pill-part]')
      ?.focus({ preventScroll: true });
  };

  const showsMore = !wrapped && hidden > 0;
  const toggleable = wrapped || hidden > 0;

  const toggle = () => (expanded ? setState('collapsing') : expand());

  // Live controls handle their own clicks; anywhere else on the band, the cut pill included, toggles it.
  const handleBandClick = (event: MouseEvent<HTMLElement>) => {
    if (!toggleable) return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    toggle();
  };

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
          'flex min-w-0 flex-1 gap-1',
          wrapped ? 'flex-wrap' : 'overflow-clip [&>[data-filter-pill]]:max-w-80',
        )}
      >
        {pills}
      </div>
      <div className='flex shrink-0 flex-col items-end gap-1 [--ring:var(--primary-foreground)]'>
        {toggleable && (
          <div className='flex h-8.5 items-center'>
            {showsMore && (
              <span
                data-band-more=''
                className={cn(
                  'relative flex h-full items-center text-xs font-medium whitespace-nowrap tabular-nums',
                  'before:pointer-events-none before:absolute before:inset-y-0 before:right-full before:w-10 before:bg-linear-to-r before:from-transparent before:to-(--band-bg)',
                )}
              >
                {t('pillMoreValues', { count: hidden })}
              </span>
            )}
            <button
              type='button'
              data-band-toggle=''
              aria-expanded={expanded}
              aria-label={t('toggleFilters')}
              onClick={() => setState(expanded ? 'collapsing' : 'expanded')}
              className='group/toggle grid size-8.5 cursor-pointer place-items-center outline-none'
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-4 rounded-md transition-transform duration-200',
                  expanded && 'rotate-180',
                  'group-focus-visible/toggle:ring-ring/50 group-focus-visible/toggle:ring-2',
                  'group-focus-visible/toggle:border-ring group-focus-visible/toggle:border',
                )}
              />
            </button>
          </div>
        )}
        {!showsMore && (
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
        )}
      </div>
    </div>
  );
}
