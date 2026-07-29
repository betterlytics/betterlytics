import React, { Dispatch, useMemo } from 'react';
import { MultiSelect } from '@/components/MultiSelect';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { useTranslations, useLocale } from 'next-intl';
import { useQueryFilterSearch } from './use-query-filter-search';
import { cn } from '@/lib/utils';

type FilterValueSearchProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  className?: string;
  useExtendedRange?: boolean;
  valueError?: boolean;
  hideClearAllButton?: boolean;
  disabled?: boolean;
};

export function FilterValueSearch<TEntity>({
  filter,
  onFilterUpdate,
  className,
  useExtendedRange,
  valueError,
  hideClearAllButton,
  disabled,
}: FilterValueSearchProps<TEntity>) {
  const t = useTranslations('components.filters.selector');
  const tMisc = useTranslations('misc');
  const locale = useLocale();
  const strategy = useMemo(() => getFilterStrategy(filter.column), [filter.column]);

  const { search, setSearch, options } = useQueryFilterSearch(filter, {
    useExtendedRange,
    disabled,
  });

  const multiSelectOptions = useMemo(() => {
    const searchOptions = options.map((opt) => ({
      label: strategy.formatValue(opt, locale),
      value: opt,
    }));

    const selectedNotInResults = filter.values
      .filter((v) => !options.includes(v))
      .map((v) => ({
        label: strategy.formatValue(v, locale),
        value: v,
      }));

    return [...selectedNotInResults, ...searchOptions];
  }, [options, filter.values, strategy, locale]);

  return (
    <MultiSelect
      options={multiSelectOptions}
      disabled={disabled}
      inputValue={search}
      onInputValueChange={setSearch}
      value={filter.values.map((value) => ({
        label: strategy.formatValue(value, locale),
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
        <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
          <span>{t('noValuesForCurrentPeriod')}</span>
        </div>
      }
      loadingIndicator={
        <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
          <span>{tMisc('loading')}</span>
        </div>
      }
      creatable
    />
  );
}
