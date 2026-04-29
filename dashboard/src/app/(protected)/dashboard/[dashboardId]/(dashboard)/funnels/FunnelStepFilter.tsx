import { type FunnelStep } from '@/entities/analytics/funnels.entities';
import { memo, type Dispatch } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { FilterBadgeMultiSelect } from '@/components/filters/FilterBadgeMultiSelect';

type FunnelStepFilterProps = {
  step: FunnelStep;
  onStepChange: Dispatch<FunnelStep>;
  onStepRemove: Dispatch<string>;
  disableDeletion?: boolean;
  showEmptyError?: boolean;
  globalPropertyKeys?: string[];
};

function FunnelStepFilterComponent({
  step,
  onStepChange,
  onStepRemove,
  disableDeletion,
  showEmptyError,
  globalPropertyKeys,
}: FunnelStepFilterProps) {
  const t = useTranslations('components.filters');

  const showNameEmptyError = showEmptyError && step.name.trim() === '';
  const showFilterEmptyError = showEmptyError && step.filters.length === 0;

  return (
    <div className='flex h-fit min-h-14 w-full items-start gap-2 p-2'>
      <Input
        className={cn('w-40 truncate shrink-0 mt-1', showNameEmptyError && 'border-destructive')}
        value={step.name}
        onChange={(e) => onStepChange({ ...step, name: e.target.value })}
        placeholder={t('namePlaceholder')}
      />

      <FilterBadgeMultiSelect
        className='flex-1'
        filters={step.filters}
        onFilterAdd={(filter) => onStepChange({ ...step, filters: [...step.filters, filter] })}
        onFilterUpdate={(filter) =>
          onStepChange({
            ...step,
            filters: step.filters.map((f) => (f.id === filter.id ? filter : f)),
          })
        }
        onFilterRemove={(filterId) =>
          onStepChange({ ...step, filters: step.filters.filter((f) => f.id !== filterId) })
        }
        onFiltersReplace={(filters) => onStepChange({ ...step, filters })}
        globalPropertyKeys={globalPropertyKeys}
        showError={showFilterEmptyError}
        useExtendedRange
        formatLength={40}
      />

      <Button
        variant='ghost'
        className='cursor-pointer'
        onClick={() => onStepRemove(step.id)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export const FunnelStepFilter = memo(FunnelStepFilterComponent) as typeof FunnelStepFilterComponent;
