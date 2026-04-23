import { QueryFilter } from '@/entities/analytics/filter.entities';
import { Dispatch } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';

type FunnelStepFilterProps = {
  onFilterUpdate: Dispatch<QueryFilter & { name: string }>;
  filter: QueryFilter & { name: string };
  requestRemoval: () => void;
  disableDeletion?: boolean;
  showEmptyError?: boolean;
  globalPropertyKeys?: string[];
};

export function FunnelStepFilter({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  showEmptyError,
  globalPropertyKeys,
}: FunnelStepFilterProps) {
  const t = useTranslations('components.filters');

  const showNameEmptyError = showEmptyError && filter.name.trim() === '';

  return (
    <div className='flex h-fit min-h-14 w-full items-start gap-2 p-2'>
      <Input
        className={cn('w-52 min-w-36', showNameEmptyError && 'border-destructive')}
        value={filter.name}
        onChange={(e) => onFilterUpdate({ ...filter, name: e.target.value })}
        placeholder={t('namePlaceholder')}
      />
      <div className='grow'>
        <QueryFilterInputRow<{ name: string }>
          filter={filter}
          onFilterUpdate={onFilterUpdate}
          requestRemoval={() => requestRemoval()}
          disableDeletion={disableDeletion}
          globalPropertyKeys={globalPropertyKeys}
        />
      </div>
    </div>
  );
}
