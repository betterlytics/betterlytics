import { QueryFilter } from '@/entities/analytics/filter.entities';
import { isNestedFilter } from '@/entities/analytics/filterColumnStrategy';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';

type FunnelStepFilterProps = {
  onFilterUpdate: (filter: QueryFilter & { name: string }) => void;
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
  const showValueEmptyError = showEmptyError && filter.values.length === 0;

  return (
    <div className='flex h-fit min-h-14 w-full items-start gap-2 p-2'>
      <Input
        className={cn(
          'w-52 min-w-36',
          isNestedFilter(filter) ? 'mt-[calc(--spacing(1)+var(--spacing-filter-subtitle))]' : 'mt-1',
          showNameEmptyError && 'border-destructive',
        )}
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
          useExtendedRange
          formatLength={45}
          valueError={showValueEmptyError}
        />
      </div>
    </div>
  );
}
