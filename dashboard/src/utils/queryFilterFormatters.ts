import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import type { SupportedLanguages } from '@/constants/i18n';
import type { useTranslations } from 'next-intl';

type FilterTranslation = ReturnType<typeof useTranslations<'components.filters'>>;

/**
 * Formats a Query Filter using translations
 */
export function formatQueryFilter(filter: QueryFilter, t: FilterTranslation, locale?: SupportedLanguages) {
  const strategy = getFilterStrategy(filter.column);
  const label = strategy.type === 'standard' ? t(`columns.${strategy.key}`) : strategy.key;
  const operator = filter.operator === '=' ? t('is') : t('isNot');
  const value = locale
    ? filter.values.map((v) => strategy.formatValue(v, locale)).join(', ')
    : filter.values.join(', ');

  return `${label} ${operator} ${value}`;
}
