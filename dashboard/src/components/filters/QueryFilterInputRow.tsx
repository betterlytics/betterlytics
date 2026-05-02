import { Button } from '@/components/ui/button';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Dispatch } from 'react';
import { FilterColumnDropdown } from '@/components/filters/FilterColumnDropdown';
import { FilterOperatorSelector } from '@/components/filters/FilterOperatorSelector';
import { FilterValueSearch } from '@/components/filters/FilterValueSearch';

type QueryFilterInputRowProps<TEntity> = {
  filter: QueryFilter & TEntity;
  disableDeletion?: boolean;
  globalPropertyKeys?: string[];
  useExtendedRange?: boolean;
  formatLength?: number;
  valueError?: boolean;
  className?: string;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  requestRemoval?: (id: QueryFilter['id']) => void;
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
  className,
}: QueryFilterInputRowProps<TEntity>) {
  return (
    <div
      className={cn(
        'grid items-start gap-1 rounded border md:border-0 p-1',
        'grid-cols-[minmax(0,8fr)_minmax(0,2fr)_minmax(0,2fr)] [grid-template-areas:"col_op_op"_"val_val_delete"]',
        'md:grid-cols-[minmax(0,4fr)_minmax(0,2fr)_minmax(0,5fr)_minmax(0,1fr)] md:[grid-template-areas:"col_op_val_delete"] md:grid-rows-1',
        className,
      )}
    >
      <FilterColumnDropdown
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        globalPropertyKeys={globalPropertyKeys}
        className='[grid-area:col]'
      />
      <FilterOperatorSelector
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        className='[grid-area:op]'
      />
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className='[grid-area:val]'
        useExtendedRange={useExtendedRange}
        formatLength={formatLength}
        valueError={valueError}
      />
      <Button
        variant='ghost'
        className='[grid-area:delete] cursor-pointer'
        onClick={() => requestRemoval?.(filter.id)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
