import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { formatFilterValue } from '@/utils/formatters';
import type { SupportedLanguages } from '@/constants/i18n';
import type { useTranslations } from 'next-intl';

type QueryFilterTranslation = ReturnType<typeof useTranslations<'components.filters'>>;

/**
 * Formats a Query Filter using translations
 */
export function formatQueryFilter(filter: QueryFilter, t: QueryFilterTranslation, locale?: SupportedLanguages) {
  if (filter.column === 'global_property' && !filter.propertyKey) {
    const presence = filter.operator === '=' ? t('isPresent') : t('isNotPresent');
    return `${filter.values.join(', ')} ${presence}`;
  }

  const column =
    filter.column === 'global_property' && filter.propertyKey
      ? filter.propertyKey
      : t(`columns.${filter.column}` as Parameters<typeof t>[0]);
  const operator = filter.operator === '=' ? t('is') : t('isNot');
  const value = locale
    ? filter.values.map((v) => formatFilterValue(filter.column, v, locale)).join(', ')
    : filter.values.join(', ');

  return `${column} ${operator} ${value}`;
}
