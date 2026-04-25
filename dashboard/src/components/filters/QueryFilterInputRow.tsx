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
  requestRemoval: (id: QueryFilter['id']) => void;
  disableDeletion?: boolean;
  globalPropertyKeys?: string[];
  useExtendedRange?: boolean;
  formatLength?: number;
  valueError?: boolean;
  className?: string;
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
  const isNested = isNestedFilter(filter);

  return (
    <div
      className={cn(
        'grid grid-cols-12 items-start gap-1 rounded border md:grid-rows-1 md:border-0',
        '[grid-template-areas:"col_col_col_col_col_col_col_col_op_op_op_op"_"val_val_val_val_val_val_val_val_val_val_delete_delete"]',
        'md:[grid-template-areas:"col_col_col_col_op_op_val_val_val_val_val_delete"]',
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
        className={cn('[grid-area:op] w-full cursor-pointer', isNested && 'mt-filter-subtitle')}
      />
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className={cn('[grid-area:val]', isNested && 'mt-filter-subtitle')}
        useExtendedRange={useExtendedRange}
        formatLength={formatLength}
        valueError={valueError}
      />
      <Button
        variant='ghost'
        className={cn('[grid-area:delete] cursor-pointer', isNested && 'mt-filter-subtitle')}
        onClick={() => requestRemoval(filter.id)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
