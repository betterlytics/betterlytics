import React, { Dispatch, useMemo } from 'react';
import { MultiSelect, type Option } from '@/components/MultiSelect';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { useTranslations, useLocale } from 'next-intl';
import { useQueryFilterSearch } from './use-query-filter-search';
import { cn } from '@/lib/utils';
import { formatString } from '@/utils/formatters';
import { FilterValueLabel } from '@/components/filters/FilterValueLabel';

type FilterValueSearchProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  className?: string;
  useExtendedRange?: boolean;
  formatLength?: number;
  valueError?: boolean;
  hideClearAllButton?: boolean;
  disabled?: boolean;
  siblingFilters: QueryFilter[];
};

export function FilterValueSearch<TEntity>({
  filter,
  onFilterUpdate,
  className,
  useExtendedRange,
  formatLength = 25,
  valueError,
  hideClearAllButton,
  disabled,
  siblingFilters,
}: FilterValueSearchProps<TEntity>) {
  const t = useTranslations('components.filters.selector');
  const locale = useLocale();
  const strategy = getFilterStrategy(filter.column);

  const { search, setSearch, options, isLoading, emptyIndicator } = useQueryFilterSearch(filter, {
    useExtendedRange,
    disabled,
    siblingFilters,
  });

  const formatLabel = (value: string) => formatString(strategy.formatValue(value, locale), formatLength);

  const multiSelectOptions = useMemo(() => {
    const searchOptions = options.map((opt) => ({
      label: formatLabel(opt),
      value: opt,
    }));

    const selectedNotInResults = filter.values
      .filter((v) => !options.includes(v))
      .map((v) => ({
        label: formatLabel(v),
        value: v,
      }));

    return [...selectedNotInResults, ...searchOptions];
  }, [options, filter.values, formatLength, filter.column, locale]);

  const renderOption = (option: Option) => (
    <FilterValueLabel column={filter.column} value={option.value} className='flex min-w-0'>
      <span className='truncate'>{option.label}</span>
    </FilterValueLabel>
  );

  return (
    <MultiSelect
      renderOption={renderOption}
      options={multiSelectOptions}
      disabled={disabled}
      inputValue={search}
      onInputValueChange={setSearch}
      value={filter.values.map((value) => ({
        label: formatString(strategy.formatValue(value, locale), Math.floor(formatLength * 0.835)),
        value,
      }))}
      onChange={(options) => onFilterUpdate({ ...filter, values: options.map((v) => v.value) })}
      placeholder={filter.values.length === 0 ? t('selectValue') : undefined}
      className={cn('dark:bg-input/25 dark:hover:bg-input/50', valueError && 'border-destructive')}
      commandProps={{
        className: cn('dark:bg-input/10 dark:hover:bg-input/50', className),
        shouldFilter: false, // Parent handles filtering via hook
      }}
      badgeClassName='bg-popover'
      hideClearAllButton={hideClearAllButton}
      emptyIndicator={
        emptyIndicator ?? (
          <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
            <span>{t('noValuesForCurrentPeriod')}</span>
          </div>
        )
      }
      loading={isLoading && options.length === 0}
      creatable
    />
  );
}
