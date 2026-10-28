import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { findCountryName } from '@/utils/countryCodes';

type SubdivisionNames = typeof import('@/utils/subdivisionCodes');

let loadedSubdivisionNames: SubdivisionNames | null = null;

/*
 * Region names carry the CLDR subdivision tables, so they load only once `wanted` turns true, never with the
 * page. Until they arrive, or if the chunk fails to load, regions show their codes.
 */
export function useFilterValueNames(column: FilterColumn, wanted: boolean): (value: string) => string {
  const locale = useLocale();
  const [subdivisionNames, setSubdivisionNames] = useState(loadedSubdivisionNames);

  useEffect(() => {
    if (!wanted || column !== 'subdivision_code' || subdivisionNames) return;
    let active = true;
    import('@/utils/subdivisionCodes')
      .then((names) => {
        loadedSubdivisionNames = names;
        if (active) setSubdivisionNames(names);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [wanted, column, subdivisionNames]);

  return useCallback(
    (value: string) => {
      switch (column) {
        case 'country_code':
          return findCountryName(value, locale) ?? value;
        case 'subdivision_code':
          return subdivisionNames?.getSubdivisionName(value, locale) ?? value;
        default:
          return getFilterStrategy(column).formatValue(value, locale);
      }
    },
    [column, locale, subdivisionNames],
  );
}
