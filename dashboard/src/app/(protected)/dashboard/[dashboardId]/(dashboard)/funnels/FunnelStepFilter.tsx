import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { Dispatch } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FilterValueSearch } from '@/components/filters/FilterValueSearch';
import { FilterColumnDropdown } from '@/components/filters/FilterColumnDropdown';
import { FilterOperatorSelector } from '@/components/filters/FilterOperatorSelector';
import { Input } from '@/components/ui/input';

type FunnelStepFilterProps = {
  onFilterUpdate: Dispatch<QueryFilter & { name: string }>;
  filter: QueryFilter & { name: string };
  requestRemoval: () => void;
  disableDeletion?: boolean;
  showEmptyError?: boolean;
};

export function FunnelStepFilter({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  showEmptyError,
}: FunnelStepFilterProps) {
  const t = useTranslations('components.filters');

  const showNameEmptyError = showEmptyError && filter.name.trim() === '';
  const showValueEmptyError = showEmptyError && filter.values.length === 0;

  return (
    <div className='flex h-fit min-h-14 w-full items-start gap-2 p-2'>
      <Input
        className={cn('w-52 min-w-36', showNameEmptyError && 'border-destructive')}
        value={filter.name}
        onChange={(e) => onFilterUpdate({ ...filter, name: e.target.value })}
        placeholder={t('namePlaceholder')}
      />
      <div className='flex grow gap-2'>
        <FilterColumnDropdown
          filter={filter}
          onFilterUpdate={onFilterUpdate}
          className='w-50'
        />
        <FilterOperatorSelector
          filter={filter}
          onFilterUpdate={onFilterUpdate}
          className='w-25 cursor-pointer'
        />
        <FilterValueSearch
          filter={filter}
          onFilterUpdate={onFilterUpdate}
          key={filter.column}
          className={cn('grow', showValueEmptyError && 'border-destructive')}
          useExtendedRange
          formatLength={45}
        />
      </div>
      <Button variant='ghost' className='cursor-pointer' onClick={requestRemoval} disabled={disableDeletion}>
        <Trash2 />
      </Button>
    </div>
  );
}
