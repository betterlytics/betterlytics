import React, { Dispatch } from 'react';
import { useQueryFilterSearch } from './use-query-filter-search';
import { Combobox } from '@/components/ui/combobox';
import { type QueryFilter } from '@/entities/analytics/filter';
import { useTranslations } from 'next-intl';

type FilterValueSearchProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  className?: string;
  triggerClassName?: string;
};

export function FilterValueSearch<TEntity>({
  filter,
  onFilterUpdate,
  className,
  triggerClassName,
}: FilterValueSearchProps<TEntity>) {
  const t = useTranslations('components.filters.selector');

  const { options, isLoading, setSearch, search, isDirty } = useQueryFilterSearch(filter);

  return (
    <Combobox
      className={className}
      triggerClassName={triggerClassName}
      value={filter.value}
      placeholder={t('selectValue')}
      onValueChange={(value) => onFilterUpdate({ ...filter, value })}
      options={options}
      searchQuery={isDirty ? search : search || filter.value}
      onSearchChange={setSearch}
      loading={isLoading}
      enableSearch={true}
      emptyState={
        <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
          <span>{t('noValuesForCurrentPeriod')}</span>
        </div>
      }
    />
  );
}
