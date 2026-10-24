import React, { Dispatch, useMemo } from 'react';
import { MultiSelect, type Option } from '@/components/MultiSelect';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { useTranslations, useLocale } from 'next-intl';
import { useQueryFilterSearch } from './use-query-filter-search';
import { cn } from '@/lib/utils';
import { formatString } from '@/utils/formatters';
import { FilterValueLabel } from '@/components/filters/FilterValueLabel';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_VISIBLE_OPTIONS = 200;
const SKELETON_ROW_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3'];

type FilterValueSearchProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  className?: string;
  useExtendedRange?: boolean;
  formatLength?: number;
  valueError?: boolean;
  hideClearAllButton?: boolean;
  disabled?: boolean;
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
}: FilterValueSearchProps<TEntity>) {
  const t = useTranslations('components.filters.selector');
  const tMisc = useTranslations('misc');
  const locale = useLocale();
  const strategy = getFilterStrategy(filter.column);

  const { search, setSearch, options, isTruncated, isLoading } = useQueryFilterSearch(filter, {
    useExtendedRange,
    disabled,
  });

  const formatLabel = (value: string) => formatString(strategy.formatValue(value, locale), formatLength);

  // Selected values are hidden from the dropdown, so they don't count towards the visible values
  const unselectedOptions = useMemo(
    () => options.filter((opt) => !filter.values.includes(opt)),
    [options, filter.values],
  );

  const multiSelectOptions = useMemo(() => {
    const searchOptions = unselectedOptions.slice(0, MAX_VISIBLE_OPTIONS).map((opt) => ({
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
  }, [unselectedOptions, options, filter.values, formatLength, filter.column, locale]);

  const truncationHint =
    unselectedOptions.length > MAX_VISIBLE_OPTIONS ? (
      <div className='text-muted-foreground border-t px-3 py-2 text-xs'>
        {t(isTruncated ? 'valuesTruncatedAtLimit' : 'valuesTruncated', {
          shown: MAX_VISIBLE_OPTIONS,
          // At the server limit the real total is unknown, so it reads as "5,000+"
          total: isTruncated ? options.length : unselectedOptions.length,
        })}
      </div>
    ) : undefined;

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
      rootClassName={cn('dark:bg-input/10 dark:hover:bg-input/50', className)}
      footer={truncationHint}
      badgeClassName='bg-popover'
      hideClearAllButton={hideClearAllButton}
      emptyIndicator={
        <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
          <span>{t('noValuesForCurrentPeriod')}</span>
        </div>
      }
      loading={isLoading}
      loadingIndicator={
        <div className='p-1' role='status' aria-label={tMisc('loading')}>
          {SKELETON_ROW_WIDTHS.map((width) => (
            <div key={width} className='flex h-8 items-center px-2'>
              <Skeleton className={cn('h-4', width)} />
            </div>
          ))}
        </div>
      }
      creatable
    />
  );
}
