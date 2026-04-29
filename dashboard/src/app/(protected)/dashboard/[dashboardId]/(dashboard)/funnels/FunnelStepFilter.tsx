import { QueryFilter } from '@/entities/analytics/filter.entities';
import { Dispatch, memo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';

type FunnelStepFilterProps = {
  onFilterUpdate: Dispatch<QueryFilter & { name: string }>;
  filter: QueryFilter & { name: string };
  requestRemoval: (id: QueryFilter['id']) => void;
  disableDeletion?: boolean;
  showEmptyError?: boolean;
  globalPropertyKeys?: string[];
};

function FunnelStepFilterComponent({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  showEmptyError,
  globalPropertyKeys,
}: FunnelStepFilterProps) {
  const t = useTranslations('components.filters');

  const showNameEmptyError = showEmptyError && filter.name.trim() === '';
  const showValueEmptyError = showEmptyError && filter.values.length === 0;

  return (
    <div className='flex h-fit min-h-14 w-full items-start gap-2 p-2'>
      <Input
        className={cn('w-40 truncate shrink-0 mt-1', showNameEmptyError && 'border-destructive')}
        value={filter.name}
        onChange={(e) => onFilterUpdate({ ...filter, name: e.target.value })}
        placeholder={t('namePlaceholder')}
      />
      <QueryFilterInputRow<{ name: string }>
        className={cn(
          'grow gap-2 md:grid-cols-24',
          'md:[grid-template-areas:"col_col_col_col_col_col_col_op_op_op_op_val_val_val_val_val_val_val_val_val_val_val_val_delete"]'
        )}
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        requestRemoval={requestRemoval}
        disableDeletion={disableDeletion}
        globalPropertyKeys={globalPropertyKeys}
        useExtendedRange
        formatLength={40}
        valueError={showValueEmptyError}
      />
    </div>
  );
}

export const FunnelStepFilter = memo(FunnelStepFilterComponent) as typeof FunnelStepFilterComponent;
