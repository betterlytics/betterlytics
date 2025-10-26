import React, { Dispatch } from 'react';
import { useQueryFilterSearch } from './use-query-filter-search';
import { Combobox } from '@/components/ui/combobox';
import { type QueryFilter } from '@/entities/filter';
import { useTranslations } from 'next-intl';

type FilterValueSearchProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
};

export function FilterValueSearch<TEntity>({ filter, onFilterUpdate }: FilterValueSearchProps<TEntity>) {
  const t = useTranslations('components.filters.selector');

  const { options, isLoading, setSearch, search, isDirty } = useQueryFilterSearch(filter);

  return (
    <Combobox
      className='col-span-10 md:col-span-5'
      value={filter.value}
      placeholder={t('selectValue')}
      onValueChange={(value) => onFilterUpdate({ ...filter, value })}
      options={options}
      searchQuery={isDirty ? search : search || filter.value}
      onSearchChange={setSearch}
      loading={isLoading}
      enableSearch={true}
      emptyState={
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <span>{t('noDataForCurrentPeriod')}</span>
        </div>
      }
    />
  );
}
