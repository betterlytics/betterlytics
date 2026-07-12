'use client';

import { useCallback } from 'react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { isFilterColumn } from '@/entities/analytics/filter.entities';
import type { ProgressBarData } from '@/components/MultiProgressTable';

/**
 * Data-driven click handling for MultiProgressTable rows: a row is interactive
 * iff it declares a `filterColumn`, and clicking it applies `filterValue ?? label`
 * to that column.
 */
export function useProgressTableFilterClick() {
  const { applyFilter } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = useCallback(
    (_tabKey: string, item: ProgressBarData) => {
      if (!item.filterColumn || !isFilterColumn(item.filterColumn)) return;
      applyFilter(item.filterColumn, item.filterValue ?? item.label);
    },
    [applyFilter],
  );

  const isItemInteractive = useCallback(
    (_tabKey: string, item: ProgressBarData) => Boolean(item.filterColumn),
    [],
  );

  return { onItemClick, isItemInteractive };
}
