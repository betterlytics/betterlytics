'use client';

import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { FilterPillSection } from '@/components/filters/FilterPillSection';
import { FilterValueIcon } from '@/components/filters/FilterValueLabel';
import { hiddenPillValueCount, mountedPillValueCount } from '@/components/filters/pillValuesOverflow';
import { type QueryFiltersEditorTarget } from '@/contexts/QueryFiltersEditorProvider';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';

type FilterPillValuesProps = {
  filter: QueryFilter;
  onOpen: Dispatch<QueryFiltersEditorTarget>;
};

// `render(true)` is what the probe measures: the same text with the icon's footprint in place of the icon.
type PillValue = { render: (placeholder: boolean) => ReactNode; rest?: boolean };

/*
 * Values sit in a ladder of nested flex rows where the deeper row always gives way first: values fold whole from
 * the end, exactly one gets cut, and the rest reach zero width. So the last value is squeezed exactly when
 * something does not fit, and a probe on it fades the cut edge in pure CSS. The "+N more" label is counted on the
 * client once the layout is known, and covers that fade with its own.
 */
export const FilterPillValues = memo(function FilterPillValues({ filter, onOpen }: FilterPillValuesProps) {
  const t = useTranslations('components.filters');
  const locale = useLocale();
  const strategy = getFilterStrategy(filter.column);
  const count = filter.values.length;
  const mounted = mountedPillValueCount(filter.values);
  const valuesRef = useRef<HTMLSpanElement>(null);

  const values: PillValue[] = filter.values.slice(0, mounted).map((value, index) => ({
    render: (placeholder) => (
      <>
        <span className='mr-1.5 inline-flex align-[-0.2em] empty:hidden'>
          <FilterValueIcon column={filter.column} value={value} placeholder={placeholder} />
        </span>
        {strategy.formatValue(value, locale)}
        {index < count - 1 && ','}
      </>
    ),
  }));
  if (mounted < count) {
    values.push({ render: () => `+${count - mounted}`, rest: true });
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
        <span ref={valuesRef} data-pill-values='' className='relative flex min-w-0'>
          <PillValuesLadder values={values} />
          <PillMoreLabel valuesRef={valuesRef} values={filter.values} />
        </span>
      )}
    </FilterPillSection>
  );
});

function PillValuesLadder({ values }: { values: PillValue[] }) {
  const [value, ...rest] = values;
  const last = rest.length === 0;
  const item = (
    <span data-pill-value='' data-pill-rest={value.rest ? '' : undefined} className='relative block min-w-0'>
      <span className='mr-1 block overflow-clip whitespace-nowrap'>{value.render(false)}</span>
      {last && <PillOverflowFade value={value} />}
    </span>
  );
  if (last) return item;
  return (
    <span className='flex min-w-0 [&>:last-child]:shrink-[1000000]'>
      {item}
      <PillValuesLadder values={rest} />
    </span>
  );
}

/*
 * An invisible copy of the last value at natural width minus a pixel; the pixel left over collapses only when the
 * value is squeezed, which is exactly when the pill does not fit everything. The fade then hangs off the cut edge.
 */
function PillOverflowFade({ value }: { value: PillValue }) {
  return (
    <span aria-hidden className='pointer-events-none absolute inset-0 flex'>
      <span className='invisible mr-[3px] shrink-0 whitespace-nowrap'>{value.render(true)}</span>
      <span data-pill-probe='' className='@container min-w-0 shrink-[1000000] grow basis-px'>
        <span className='absolute inset-y-0 right-0 hidden w-10 bg-linear-to-r from-transparent to-(--pill-bg) @max-[0.5px]:block' />
      </span>
    </span>
  );
}

// Its own component, so a new count re-renders only the label and not the whole ladder.
function PillMoreLabel({ valuesRef, values }: { valuesRef: RefObject<HTMLSpanElement | null>; values: string[] }) {
  const t = useTranslations('components.filters');
  const labelRef = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(0);
  const count = values.length;

  const measure = useCallback(() => {
    const container = valuesRef.current;
    if (container && labelRef.current) {
      setHidden(hiddenPillValueCount(container, labelRef.current, count));
    }
  }, [valuesRef, count]);

  // After every render, so the count follows edits, locale changes and its own text, whose width decides what it covers.
  useLayoutEffect(measure);

  useLayoutEffect(() => {
    const container = valuesRef.current;
    const label = labelRef.current;
    if (!container || !label) return;
    // flushSync paints the new count in the same frame as the resize that changed it.
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(container);
    observer.observe(label);
    container.querySelectorAll('[data-pill-value]').forEach((value) => observer.observe(value));
    return () => observer.disconnect();
  }, [valuesRef, measure, values]);

  return (
    <span
      ref={labelRef}
      aria-hidden
      className={cn(
        'text-muted-foreground absolute inset-y-0 right-0 flex min-w-10 items-center justify-end bg-(--pill-bg) whitespace-nowrap tabular-nums',
        'before:absolute before:inset-y-0 before:right-full before:w-10',
        'before:bg-linear-to-r before:from-transparent before:to-(--pill-bg)',
        hidden === 0 && 'invisible',
      )}
    >
      {hidden > 0 && t('pillMoreValues', { count: hidden })}
    </span>
  );
}
