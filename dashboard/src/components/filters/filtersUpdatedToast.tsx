'use client';

import { useEffect } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FilterDescription } from '@/components/filters/FilterDescription';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { generateTempId } from '@/utils/temporaryId';

const FILTER_TOAST_DURATION_MS = 10000;

let currentToastId: string | undefined;

type FilterChanges = {
  added: QueryFilter[];
  removed: QueryFilter[];
};

export function showFiltersUpdatedToast(props: FilterChanges & { onUndo: () => void }) {
  if (currentToastId !== undefined) toast.dismiss(currentToastId);
  const id = generateTempId();
  currentToastId = id;
  const onUndo = () => {
    props.onUndo();
    toast.dismiss(id);
  };
  toast(<FiltersUpdatedToast added={props.added} removed={props.removed} onUndo={onUndo} />, {
    id,
    duration: FILTER_TOAST_DURATION_MS,
    // use the toast's full width.
    classNames: { content: 'w-full min-w-0', title: 'w-full min-w-0' },
  });
}

/* The toast's Undo targets the query-filter state of the shell that hosts
   click-to-filter, so that shell dismisses the toast when it unmounts. */
export function useDismissFilterToastOnUnmount() {
  useEffect(() => {
    return () => {
      if (currentToastId !== undefined) toast.dismiss(currentToastId);
    };
  }, []);
}

function FiltersUpdatedToast({ added, removed, onUndo }: FilterChanges & { onUndo: () => void }) {
  const t = useTranslations('components.filters');

  // A same-column replacement reads as the pill changing value; only real disappearances get a minus row.
  const addedColumns = new Set(added.map((filter) => filter.column));
  const visibleRemoved = removed.filter((filter) => !addedColumns.has(filter.column));

  return (
    <div className='flex w-full min-w-0 flex-col gap-1.5'>
      <div className='flex w-full items-center justify-between gap-3'>
        <span className='text-sm font-medium'>{t('toastFiltersUpdated')}</span>
        <Button variant='outline' size='sm' className='h-6 shrink-0 cursor-pointer px-2 text-xs' onClick={onUndo}>
          {t('selector.toastUndo')}
        </Button>
      </div>
      <div className='flex min-w-0 flex-col gap-0.5'>
        {added.map((filter) => (
          <span key={filter.id} className='flex min-w-0 items-center gap-1'>
            <PlusIcon aria-hidden className='size-3 shrink-0' />
            <span className='sr-only'>{t('toastFilterAdded')}</span>
            <FilterDescription filter={filter} className='max-w-full' />
          </span>
        ))}
        {visibleRemoved.map((filter) => (
          <span key={filter.id} className='flex min-w-0 items-center gap-1'>
            <MinusIcon aria-hidden className='size-3 shrink-0' />
            <span className='sr-only'>{t('toastFilterRemoved')}</span>
            <FilterDescription filter={filter} className='max-w-full' />
          </span>
        ))}
      </div>
    </div>
  );
}
