import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';
import { Dispatch } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterValueSearch } from './FilterValueSearch';
import { FilterColumnDropdown } from './FilterColumnDropdown';
import { FilterOperatorSelector } from './FilterOperatorSelector';

type QueryFilterInputRowProps<TEntity> = {
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  filter: QueryFilter & TEntity;
  requestRemoval: Dispatch<QueryFilter & TEntity>;
  disableDeletion?: boolean;
  globalPropertyKeys?: string[];
};

export function QueryFilterInputRow<TEntity>({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  globalPropertyKeys,
}: QueryFilterInputRowProps<TEntity>) {
  const hasSubtitle = getFilterStrategy(filter.column).type === 'json_property';

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
        className={cn('col-span-4 w-full cursor-pointer md:col-span-2', hasSubtitle && 'mt-3.5')}
      />
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className={cn('col-span-10 md:col-span-5', hasSubtitle && 'mt-3.5')}
      />
      <Button
        variant='ghost'
        className={cn('col-span-2 cursor-pointer md:col-span-1', hasSubtitle && 'mt-3.5')}
        onClick={() => requestRemoval(filter)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
