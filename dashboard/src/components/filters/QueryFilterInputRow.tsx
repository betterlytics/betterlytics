import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { isNestedFilter } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterValueSearch } from './FilterValueSearch';
import { FilterColumnDropdown } from './FilterColumnDropdown';
import { FilterOperatorSelector } from './FilterOperatorSelector';

type QueryFilterInputRowProps<TEntity> = {
  onFilterUpdate: (filter: QueryFilter & TEntity) => void;
  filter: QueryFilter & TEntity;
  requestRemoval: (filter: QueryFilter & TEntity) => void;
  disableDeletion?: boolean;
  globalPropertyKeys?: string[];
  useExtendedRange?: boolean;
  formatLength?: number;
  valueError?: boolean;
};

export function QueryFilterInputRow<TEntity>({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  globalPropertyKeys,
  useExtendedRange,
  formatLength,
  valueError,
}: QueryFilterInputRowProps<TEntity>) {
  const isNested = isNestedFilter(filter);

  return (
    <div className='grid grid-cols-12 items-start gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <FilterColumnDropdown
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        globalPropertyKeys={globalPropertyKeys}
        className='col-span-8 md:col-span-4'
      />
      <FilterOperatorSelector
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        className={cn('col-span-4 w-full cursor-pointer md:col-span-2', isNested && 'mt-filter-subtitle')}
      />
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className={cn('col-span-10 md:col-span-5', isNested && 'mt-filter-subtitle')}
        useExtendedRange={useExtendedRange}
        formatLength={formatLength}
        valueError={valueError}
      />
      <Button
        variant='ghost'
        className={cn('col-span-2 cursor-pointer md:col-span-1', isNested && 'mt-filter-subtitle')}
        onClick={() => requestRemoval(filter)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
