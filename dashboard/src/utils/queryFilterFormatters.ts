import { type QueryFilter, isGlobalPropertyFilter, getGlobalPropertyKey } from '@/entities/analytics/filter.entities';
import type { useTranslations } from 'next-intl';

type QueryFilterTranslation = ReturnType<typeof useTranslations<'components.filters'>>;

/**
 * Formats a Query Filter using translations
 */
export function formatQueryFilter(filter: QueryFilter, t: QueryFilterTranslation) {
  const column = isGlobalPropertyFilter(filter.column)
    ? getGlobalPropertyKey(filter.column)
    : t(`columns.${filter.column}` as Parameters<typeof t>[0]);
  const operator = filter.operator === '=' ? t('is') : t('isNot');
  const value = filter.values.join(', ');

  return `${column} ${operator} ${value}`;
}
