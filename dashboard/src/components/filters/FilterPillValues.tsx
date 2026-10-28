'use client';

import { memo, type Dispatch, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FilterPillSection } from '@/components/filters/FilterPillSection';
import { FilterValueIcon } from '@/components/filters/FilterValueLabel';
import { mountedPillValueCount } from '@/components/filters/pillValuesOverflow';
import { type QueryFiltersEditorTarget } from '@/contexts/QueryFiltersEditorProvider';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';

type FilterPillValuesProps = {
  filter: QueryFilter;
  onOpen: Dispatch<QueryFiltersEditorTarget>;
};

// `render(true)` is what the probe measures: the same text with the icon's footprint in place of the icon.
type PillValue = { render: (placeholder: boolean) => ReactNode; hidden: number; rest?: boolean };

/*
 * Pure CSS, so the server and the client lay the values out identically. Values sit in a ladder of nested flex
 * rows where the deeper row always gives way first: values fold whole from the end, exactly one gets cut, and
 * the rest reach zero width. Each value carries a probe with an invisible copy of itself at natural width minus
 * a pixel; the pixel left over collapses only when the value is squeezed, and container queries on that pixel
 * and on the value pick one of two pre-rendered "+N more" labels. Every value needs its own labels because a query
 * container also contains style, so nothing outside a probe can learn what it found. Values past the mount
 * estimate are counted by a trailing "+N" value instead.
 */
export const FilterPillValues = memo(function FilterPillValues({ filter, onOpen }: FilterPillValuesProps) {
  const t = useTranslations('components.filters');
  const locale = useLocale();
  const strategy = getFilterStrategy(filter.column);
  const count = filter.values.length;
  const mounted = mountedPillValueCount(filter.values);

  const values: PillValue[] = filter.values.slice(0, mounted).map((value, index) => ({
    render: (placeholder) => (
      <>
        <span className='mr-1.5 inline-block align-[-0.2em] empty:hidden [&>span]:inline-flex'>
          <FilterValueIcon column={filter.column} value={value} placeholder={placeholder} />
        </span>
        {strategy.formatValue(value, locale)}
        {index < count - 1 && ','}
      </>
    ),
    hidden: count - index,
  }));
  if (mounted < count) {
    values.push({ render: () => `+${count - mounted}`, hidden: count - mounted, rest: true });
  }

  return (
    <FilterPillSection
      className='min-w-0'
      data-pill-part='values'
      onClick={() => onOpen({ filterId: filter.id, part: 'values' })}
    >
      {count === 0 ? (
        <span className='text-muted-foreground'>{t('selector.selectValue')}</span>
      ) : (
        <span data-pill-values='' className='isolate flex min-w-0'>
          <PillValuesLadder values={values} />
        </span>
      )}
    </FilterPillSection>
  );
});

function PillValuesLadder({ values }: { values: PillValue[] }) {
  const [value, ...rest] = values;
  const item = (
    <span data-pill-value='' data-pill-rest={value.rest ? '' : undefined} className='relative block min-w-0'>
      <span className='mr-1 block overflow-clip whitespace-nowrap'>{value.render(false)}</span>
      <PillValueProbe value={value} index={values.length} last={rest.length === 0} />
    </span>
  );
  if (rest.length === 0) return item;
  return (
    <span className='flex min-w-0 [&>:last-child]:shrink-[1000000]'>
      {item}
      <PillValuesLadder values={rest} />
    </span>
  );
}

/*
 * The fade hangs off the label's left edge, so it ends exactly where the count starts whatever its width. It
 * paints only while the value still has width: the zero-width values behind the cut stack their labels at the
 * same edge, and stacked fades would compound into a hard edge.
 */
const labelClassName = cn(
  'bg-(--pill-bg) text-muted-foreground absolute inset-y-0 right-0 hidden items-center whitespace-nowrap tabular-nums',
  'before:absolute before:inset-y-0 before:right-full before:hidden before:w-10 @min-[0.5px]/v:before:block',
  'before:bg-linear-to-r before:from-transparent before:to-(--pill-bg)',
);

/*
 * A cut value narrower than 7em counts itself as hidden, since the widest label ("+NN more", about 4.6em) would
 * leave too little of it readable; a wider one stays readable, so its label counts only what follows. Container
 * query ems resolve against the probe's own font size. `index` orders the labels: an earlier value's label paints
 * over a later one's at the same edge.
 */
function PillValueProbe({ value, index, last }: { value: PillValue; index: number; last: boolean }) {
  const t = useTranslations('components.filters');
  const after = last ? 0 : value.hidden - 1;
  return (
    <span aria-hidden className='@container/v pointer-events-none absolute inset-0 flex'>
      <span className='invisible mr-[3px] shrink-0 whitespace-nowrap'>{value.render(true)}</span>
      <span className='min-w-0 shrink-[1000000] grow basis-px'>
        <span className='@container block h-full w-full'>
          <span className={cn(labelClassName, '@max-[0.5px]:@max-[7em]/v:flex')} style={{ zIndex: 2 * index }}>
            {t('pillMoreValues', { count: value.hidden })}
          </span>
          <span className={cn(labelClassName, '@max-[0.5px]:@min-[7em]/v:flex')} style={{ zIndex: 2 * index + 1 }}>
            {after > 0 && t('pillMoreValues', { count: after })}
          </span>
        </span>
      </span>
    </span>
  );
}
