import { useLocale, useTranslations } from 'next-intl';
import { FilterColumnLabel } from '@/components/filters/FilterColumnLabel';
import { FilterValueLabel } from '@/components/filters/FilterValueLabel';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';

type FilterDescriptionProps = {
  filter: QueryFilter;
  className?: string;
};

export function FilterDescription({ filter, className }: FilterDescriptionProps) {
  const t = useTranslations('components.filters');
  const locale = useLocale();
  const strategy = getFilterStrategy(filter.column);
  const operator = filter.operator === '=' ? t('is') : t('isNot');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 [&_svg]:size-3',
        className,
      )}
    >
      <FilterColumnLabel column={filter.column} />
      <span className='text-muted-foreground/80'>{operator}</span>
      {filter.values.map((value, index) => (
        <FilterValueLabel key={value} column={filter.column} value={value} className='gap-1'>
          <span>
            {strategy.formatValue(value, locale)}
            {index < filter.values.length - 1 && ','}
          </span>
        </FilterValueLabel>
      ))}
    </span>
  );
}
