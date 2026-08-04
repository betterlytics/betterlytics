import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { FilterDescription } from '@/components/filters/FilterDescription';
import { type QueryFilter } from '@/entities/analytics/filter.entities';

const FILTER_TOAST_ID = 'filters-updated';
const FILTER_TOAST_DURATION_MS = 10000;

type FiltersUpdatedToastProps = {
  added: QueryFilter[];
  removed: QueryFilter[];
};

export function showFiltersUpdatedToast(props: FiltersUpdatedToastProps & { onUndo: () => void }) {
  toast(<FiltersUpdatedToast added={props.added} removed={props.removed} />, {
    id: FILTER_TOAST_ID,
    duration: FILTER_TOAST_DURATION_MS,
    action: {
      label: <UndoLabel />,
      onClick: props.onUndo,
    },
  });
}

/* The toast's Undo targets the query-filter state of the shell that hosts
   click-to-filter, so that shell dismisses the toast when it unmounts. */
export function useDismissFilterToastOnUnmount() {
  useEffect(() => {
    return () => {
      toast.dismiss(FILTER_TOAST_ID);
    };
  }, []);
}

/* As a component, the label re-resolves on locale changes while the toast is open. */
function UndoLabel() {
  const t = useTranslations('components.filters');
  return t('selector.toastUndo');
}

function FiltersUpdatedToast({ added, removed }: FiltersUpdatedToastProps) {
  const t = useTranslations('components.filters');

  return (
    <div className='flex flex-col gap-1'>
      <span className='font-medium'>{t('toastFiltersUpdated')}</span>
      <div className='flex flex-col gap-0.5'>
        {added.map((filter) => (
          <span key={filter.id} className='flex items-center gap-1.5'>
            <span aria-hidden className='font-semibold text-green-600 dark:text-green-400'>+</span>
            <span className='sr-only'>{t('toastFilterAdded')}</span>
            <FilterDescription filter={filter} />
          </span>
        ))}
        {removed.map((filter) => (
          <span key={filter.id} className='flex items-center gap-1.5'>
            <span aria-hidden className='text-destructive font-semibold'>-</span>
            <span className='sr-only'>{t('toastFilterRemoved')}</span>
            <FilterDescription filter={filter} />
          </span>
        ))}
      </div>
    </div>
  );
}
