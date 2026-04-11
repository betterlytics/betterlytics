import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { type FunnelStep } from '@/entities/analytics/funnels.entities';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { FilterBadgeMultiSelect } from '@/components/filters/FilterBadgeMultiSelect';

type FunnelStepFilterProps = {
  step: FunnelStep;
  onStepNameUpdate: (stepId: string, name: string) => void;
  onFilterAdd: (stepId: string, filter: QueryFilter) => void;
  onFilterUpdate: (stepId: string, filter: QueryFilter) => void;
  onFilterRemove: (stepId: string, filterId: string) => void;
  requestRemoval: () => void;
  disableDeletion?: boolean;
  showEmptyError?: boolean;
};

export function FunnelStepFilter({
  step,
  onStepNameUpdate,
  onFilterAdd,
  onFilterUpdate,
  onFilterRemove,
  requestRemoval,
  disableDeletion,
  showEmptyError,
}: FunnelStepFilterProps) {
  const t = useTranslations('components.filters');

  const showNameEmptyError = showEmptyError && step.name.trim() === '';
  const showFilterEmptyError = showEmptyError && step.filters.length === 0;

  const handleFilterAdd = useCallback(
    (filter: QueryFilter) => onFilterAdd(step.id, filter),
    [step.id, onFilterAdd],
  );

  const handleFilterUpdate = useCallback(
    (filter: QueryFilter) => onFilterUpdate(step.id, filter),
    [step.id, onFilterUpdate],
  );

  const handleFilterRemove = useCallback(
    (filterId: string) => onFilterRemove(step.id, filterId),
    [step.id, onFilterRemove],
  );

  return (
    <div className='flex h-fit min-h-14 w-full items-start gap-2 p-2'>
      <Input
        className={cn('w-44 min-w-36', showNameEmptyError && 'border-destructive')}
        value={step.name}
        onChange={(e) => onStepNameUpdate(step.id, e.target.value)}
        placeholder={t('namePlaceholder')}
      />

      <div className='flex-1'>
        <FilterBadgeMultiSelect
          filters={step.filters}
          onFilterAdd={handleFilterAdd}
          onFilterUpdate={handleFilterUpdate}
          onFilterRemove={handleFilterRemove}
          showError={showFilterEmptyError}
        />
      </div>

      <Button variant='ghost' className='cursor-pointer' onClick={requestRemoval} disabled={disableDeletion}>
        <Trash2 />
      </Button>
    </div>
  );
}
