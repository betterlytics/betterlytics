'use client';

import { useRef, useState, type FocusEvent, type PointerEvent, type ReactNode, type SyntheticEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { FilterColumnLabel } from '@/components/filters/FilterColumnLabel';
import { FilterValueLabel } from '@/components/filters/FilterValueLabel';
import { pillHidesValues } from '@/components/filters/pillValuesOverflow';
import { useFilterValueNames } from '@/components/filters/use-filter-value-names';
import { type QueryFilter } from '@/entities/analytics/filter.entities';

const MAX_TOOLTIP_VALUES = 20;

type FilterPillTooltipProps = {
  filter: QueryFilter;
  disabled?: boolean;
  children: ReactNode;
};

const overRemoveButton = (e: SyntheticEvent) =>
  e.target instanceof Element && e.target.closest('[data-pill-remove]') !== null;

/*
 * Shows the whole filter, so the whole pill is the trigger and the tooltip centres on it. It opens only when
 * the pill hides something, read from the layout as the pointer arrives. The remove button has its own
 * tooltip: reaching it closes this one, and moving back reopens it.
 */
export function FilterPillTooltip({ filter, disabled, children }: FilterPillTooltipProps) {
  const t = useTranslations('components.filters');
  const [open, setOpen] = useState(false);
  // Set once the pointer or focus first arrives, so value names load during the open delay rather than on mount.
  const [engaged, setEngaged] = useState(false);
  const formatValue = useFilterValueNames(filter.column, engaged);
  const pillRef = useRef<Element | null>(null);
  const overRemoveRef = useRef(false);
  const closedOverRemoveRef = useRef(false);
  const operator = t(filter.operator === '=' ? 'is' : 'isNot');

  // A delay started over a section can still fire after the pointer reached the remove button, so it is refused there.
  const handleOpenChange = (next: boolean) => {
    const pill = pillRef.current;
    setOpen(next && !disabled && !overRemoveRef.current && pill !== null && pillHidesValues(pill));
  };

  const arrive = (e: SyntheticEvent<HTMLElement>) => {
    pillRef.current = e.currentTarget;
    overRemoveRef.current = overRemoveButton(e);
    if (!engaged) setEngaged(true);
  };

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    arrive(e);
    if (overRemoveRef.current) {
      e.preventDefault();
      if (open) {
        setOpen(false);
        closedOverRemoveRef.current = true;
      }
    } else if (closedOverRemoveRef.current) {
      closedOverRemoveRef.current = false;
      handleOpenChange(true);
    }
  };

  const handlePointerLeave = () => {
    overRemoveRef.current = false;
    closedOverRemoveRef.current = false;
  };

  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    arrive(e);
    if (overRemoveRef.current) e.preventDefault();
  };

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger
        asChild
        aria-describedby={undefined}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side='bottom' className='z-40 max-w-xs'>
        {filter.values.length > 1 ? (
          <div className='flex flex-col gap-1.5 text-xs'>
            <div className='flex items-center gap-1 font-medium'>
              <FilterColumnLabel column={filter.column} className='min-w-0 [&_svg]:size-3' />
              <span className='text-muted-foreground shrink-0'>{operator}</span>
            </div>
            <ul className='flex flex-col gap-0.5'>
              {filter.values.slice(0, MAX_TOOLTIP_VALUES).map((value, index) => (
                <li key={`${index}-${value}`}>
                  <FilterValueLabel column={filter.column} value={value} className='flex'>
                    <span className='min-w-0 wrap-anywhere'>{formatValue(value)}</span>
                  </FilterValueLabel>
                </li>
              ))}
            </ul>
            {filter.values.length > MAX_TOOLTIP_VALUES && (
              <span className='text-muted-foreground'>
                {t('pillMoreValues', { count: filter.values.length - MAX_TOOLTIP_VALUES })}
              </span>
            )}
          </div>
        ) : (
          <div className='flex flex-wrap items-start gap-1 text-xs'>
            <FilterColumnLabel column={filter.column} className='min-w-0 font-medium [&_svg]:size-3' />
            <span className='text-muted-foreground shrink-0'>{operator}</span>
            <FilterValueLabel column={filter.column} value={filter.values[0]} className='min-w-0'>
              <span className='min-w-0 wrap-anywhere'>{formatValue(filter.values[0])}</span>
            </FilterValueLabel>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
