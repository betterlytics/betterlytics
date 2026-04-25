import { FILTER_COLUMNS, GP_PREFIX, type FilterColumn, type QueryFilter } from './filter.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatNumber } from '@/utils/formatters';

type BaseStrategy = {
  column: string;
  formatValue: (value: string, locale: SupportedLanguages) => string;
};

export type FilterColumnStrategy =
  | (BaseStrategy & { type: 'standard'; key: (typeof FILTER_COLUMNS)[number] })
  | (BaseStrategy & { type: 'json_property'; key: string });

function formatNumericString(value: string, locale: SupportedLanguages): string {
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return formatNumber(num, locale, { notation: 'standard', maximumFractionDigits: 5 });
  return value;
}

export function getFilterStrategy(column: FilterColumn): FilterColumnStrategy {
  if (column.startsWith(GP_PREFIX)) {
    const key = column.slice(GP_PREFIX.length);
    return {
      type: 'json_property',
      column,
      key,
      formatValue: formatNumericString,
    };
  }

  return {
    type: 'standard',
    column,
    key: column as (typeof FILTER_COLUMNS)[number],
    formatValue: (value) => value,
  };
}

export function isNestedFilter(filter: QueryFilter): boolean {
  return getFilterStrategy(filter.column).type === 'json_property';
}
