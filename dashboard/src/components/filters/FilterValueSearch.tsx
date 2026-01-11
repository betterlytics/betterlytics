import React, { Dispatch, useMemo } from 'react';
import { MultiSelect } from '@/components/MultiSelect';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { useTranslations } from 'next-intl';
import { useQueryFilterSearch } from './use-query-filter-search';
import { cn } from '@/lib/utils';
import { formatString } from '@/utils/formatters';

type FilterValueSearchProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  className?: string;
  useExtendedRange?: boolean;
  formatLength?: number;
};

export function FilterValueSearch<TEntity>({
  filter,
  onFilterUpdate,
  className,
  useExtendedRange,
  formatLength = 30,
}: FilterValueSearchProps<TEntity>) {
  const t = useTranslations('components.filters.selector');

  const { options } = useQueryFilterSearch(filter, {
    useExtendedRange,
  });

  const multiSelectOptions = useMemo(() => {
    const searchOptions = options.map((opt) => ({ label: formatString(opt, formatLength), value: opt }));
    const selectedOptions = filter.values
      .filter((v) => !options.includes(v))
      .map((v) => ({ label: formatString(v, formatLength), value: v }));
    return [...selectedOptions, ...searchOptions];
  }, [options, filter.values, formatLength]);

  return (
    <MultiSelect
      options={multiSelectOptions}
      value={filter.values.map((value) => ({
        label: formatString(value, Math.floor(formatLength * 0.835)),
        value,
      }))}
      onChange={(options) => onFilterUpdate({ ...filter, values: options.map((v) => v.value) })}
      placeholder={filter.values.length === 0 ? t('selectValue') : undefined}
      className={cn('dark:bg-input/25 dark:hover:bg-input/50', className)}
      commandProps={{
        className: cn('dark:bg-input/10 dark:hover:bg-input/50', className),
      }}
      badgeClassName='bg-popover'
      emptyIndicator={
        <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
          <span>{t('noValuesForCurrentPeriod')}</span>
        </div>
      }
    />
  );
}
