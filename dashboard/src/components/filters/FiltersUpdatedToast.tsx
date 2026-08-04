import { useTranslations } from 'next-intl';
import { FilterDescription } from '@/components/filters/FilterDescription';
import { type QueryFilter } from '@/entities/analytics/filter.entities';

type FiltersUpdatedToastProps = {
  added: QueryFilter[];
  removed: QueryFilter[];
};

/* Rendered inside the sonner toaster, outside the app providers; the caller
   wraps it in a NextIntlClientProvider so FilterDescription can translate. */
export function FiltersUpdatedToast({ added, removed }: FiltersUpdatedToastProps) {
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
