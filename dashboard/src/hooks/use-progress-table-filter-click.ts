'use client';

import { useCallback } from 'react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { isFilterColumn } from '@/entities/analytics/filter.entities';
import type { ProgressBarData } from '@/components/MultiProgressTable';

/**
 * Data-driven click handling for MultiProgressTable rows: a row is interactive
 * iff it declares `filters`, and clicking applies them atomically, with each
 * entry's value defaulting to the row label.
 */
export function useProgressTableFilterClick() {
  const { applyFilters } = useFilterClick();

  const onItemClick = useCallback(
    (_tabKey: string, item: ProgressBarData) => {
      const rowFilters = item.filters;
      if (!rowFilters?.length || !rowFilters.every((rowFilter) => isFilterColumn(rowFilter.column))) return;
      applyFilters(rowFilters.map((rowFilter) => ({ column: rowFilter.column, value: rowFilter.value ?? item.label })));
    },
    [applyFilters],
  );

  const isItemInteractive = useCallback(
    (_tabKey: string, item: ProgressBarData) => Boolean(item.filters?.length),
    [],
  );

  return { onItemClick, isItemInteractive };
}
