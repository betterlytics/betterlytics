import { parseFilterColumn, type FilterColumn, type TableFilterColumn } from './filter.entities';
import { type PropertySourceKind } from './propertySources';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatNumber } from '@/utils/formatters';

type BaseStrategy = {
  column: string;
  formatValue: (value: string, locale: SupportedLanguages) => string;
};

export type FilterColumnStrategy =
  | (BaseStrategy & { type: 'standard'; key: TableFilterColumn })
  | (BaseStrategy & { type: 'json_property'; source: PropertySourceKind; key: string });

function formatNumericString(value: string, locale: SupportedLanguages): string {
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return formatNumber(num, locale, { notation: 'standard', maximumFractionDigits: 5 });
  }
  return value;
}

export function getFilterStrategy(column: FilterColumn): FilterColumnStrategy {
  const parsed = parseFilterColumn(column);
  if (parsed.kind === 'property') {
    return { type: 'json_property', source: parsed.source, column, key: parsed.key, formatValue: formatNumericString };
  }
  return { type: 'standard', column, key: parsed.col, formatValue: (value) => value };
}
