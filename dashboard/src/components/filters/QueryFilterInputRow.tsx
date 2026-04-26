import { Button } from '@/components/ui/button';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { isNestedFilter } from '@/entities/analytics/filterColumnStrategy';
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
  const isNested = isNestedFilter(filter);

  return (
    <div
      className={cn(
        'grid grid-cols-12 items-start gap-1 rounded border md:grid-rows-1 md:border-0 p-1',
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
        className={cn('[grid-area:op]', isNested && 'mt-filter-subtitle')}
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
        onClick={() => requestRemoval?.(filter.id)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
