import { Button } from '@/components/ui/button';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Dispatch, type ReactNode } from 'react';
import { FilterColumnDropdown } from '@/components/filters/FilterColumnDropdown';
import { FilterOperatorSelector } from '@/components/filters/FilterOperatorSelector';
import { FilterValueSearch } from '@/components/filters/FilterValueSearch';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';

type QueryFilterInputRowProps<TEntity> = {
  filter: QueryFilter & TEntity;
  disableDeletion?: boolean;
  propertyKeys?: PropertyKeysBySource;
  useExtendedRange?: boolean;
  formatLength?: number;
  valueError?: boolean;
  hideClearAllButton?: boolean;
  className?: string;
  disabled?: boolean;
  disabledMessage?: ReactNode;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  requestRemoval?: (id: QueryFilter['id']) => void;
};

export function QueryFilterInputRow<TEntity>({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  propertyKeys,
  useExtendedRange,
  formatLength,
  valueError,
  hideClearAllButton,
  className,
  disabled = false,
  disabledMessage,
}: QueryFilterInputRowProps<TEntity>) {
  return (
    <div
      className={cn(
        'grid items-start gap-1 rounded border p-1 md:border-0',
        'grid-cols-[minmax(0,8fr)_minmax(0,2fr)_minmax(0,2fr)] [grid-template-areas:"col_op_op"_"val_val_delete"]',
        'md:grid-cols-[minmax(0,4fr)_minmax(0,2fr)_minmax(0,5fr)_minmax(0,1fr)] md:grid-rows-1 md:[grid-template-areas:"col_op_val_delete"]',
        className,
      )}
    >
      <DisabledTooltip disabled={disabled} message={disabledMessage} wrapperClassName='[grid-area:col]'>
        {(isDisabled) => (
          <FilterColumnDropdown
            filter={filter}
            onFilterUpdate={onFilterUpdate}
            propertyKeys={propertyKeys}
            disabled={isDisabled}
            className='[grid-area:col]'
          />
        )}
      </DisabledTooltip>
      <DisabledTooltip disabled={disabled} message={disabledMessage} wrapperClassName='[grid-area:op]'>
        {(isDisabled) => (
          <FilterOperatorSelector
            filter={filter}
            onFilterUpdate={onFilterUpdate}
            disabled={isDisabled}
            className='[grid-area:op]'
          />
        )}
      </DisabledTooltip>
      <DisabledTooltip disabled={disabled} message={disabledMessage} wrapperClassName='[grid-area:val]'>
        {(isDisabled) => (
          <FilterValueSearch
            filter={filter}
            onFilterUpdate={onFilterUpdate}
            key={filter.column}
            disabled={isDisabled}
            className='[grid-area:val]'
            useExtendedRange={useExtendedRange}
            formatLength={formatLength}
            valueError={valueError}
            hideClearAllButton={hideClearAllButton}
          />
        )}
      </DisabledTooltip>
      <Button
        variant='ghost'
        size='icon'
        className='text-muted-foreground hover:text-foreground size-8 cursor-pointer justify-self-end [grid-area:delete]'
        onClick={() => requestRemoval?.(filter.id)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
