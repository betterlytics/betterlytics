import { useTranslations } from 'next-intl';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/filterColumnOptions';
import { PROPERTY_SOURCE_ICONS } from '@/components/filters/propertySourceIcons';
import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';

type FilterColumnLabelProps = {
  column: FilterColumn;
  className?: string;
};

export function FilterColumnLabel({ column, className }: FilterColumnLabelProps) {
  const t = useTranslations('components.filters');
  const strategy = getFilterStrategy(column);
  const icon =
    strategy.type === 'json_property'
      ? PROPERTY_SOURCE_ICONS[strategy.source]
      : FILTER_COLUMN_SELECT_OPTIONS.find((opt) => opt.value === strategy.key)?.icon;
  const label = strategy.type === 'json_property' ? strategy.key : t(`columns.${strategy.key}`);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.75 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
        className,
      )}
    >
      {icon}
      <span className='truncate'>{label}</span>
    </span>
  );
}
