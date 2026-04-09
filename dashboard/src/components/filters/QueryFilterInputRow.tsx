import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { Dispatch } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterValueSearch } from './FilterValueSearch';
import { FilterColumnDropdown } from './FilterColumnDropdown';
import { FilterOperatorSelector } from './FilterOperatorSelector';
export { FILTER_COLUMN_SELECT_OPTIONS } from './filterColumnOptions';

type QueryFilterInputRowProps<TEntity> = {
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  filter: QueryFilter & TEntity;
  requestRemoval: Dispatch<QueryFilter & TEntity>;
  disableDeletion?: boolean;
};

export function QueryFilterInputRow<TEntity>({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
}: QueryFilterInputRowProps<TEntity>) {
  return (
    <div className='grid grid-cols-12 items-end gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <FilterColumnDropdown filter={filter} onFilterUpdate={onFilterUpdate} className='col-span-8 md:col-span-4' />
      <FilterOperatorSelector
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        className='col-span-4 w-full md:col-span-2'
      />
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className='col-span-10 md:col-span-5'
      />
      <Button
        variant='ghost'
        className='col-span-2 cursor-pointer md:col-span-1'
        onClick={() => requestRemoval(filter)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
