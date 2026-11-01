'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { useReferrerCategoryLabel } from '@/hooks/use-referrer-category-label';

// Display only: filters keep storing the raw value, so URLs and saved filters are unaffected
export function useFilterValueFormatter() {
  const locale = useLocale();
  const referrerCategoryLabel = useReferrerCategoryLabel();

  return useCallback(
    (column: FilterColumn, value: string) => {
      if (column === 'referrer_source') return referrerCategoryLabel(value);
      return getFilterStrategy(column).formatValue(value, locale);
    },
    [locale, referrerCategoryLabel],
  );
}
