'use client';

import { useState, useCallback } from 'react';
import { SaveIcon, Loader2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { useCreateSavedFilter } from '@/hooks/use-saved-filters';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';

type SaveQueryFilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: QueryFilter[];
};

export function SaveQueryFilterDialog({ open, onOpenChange, filters }: SaveQueryFilterDialogProps) {
  const [filterName, setFilterName] = useState('');
  const t = useTranslations('components.filters');
  const createSavedFilterMutation = useCreateSavedFilter();

  const handleSave = useCallback(async () => {
    if (!filterName.trim()) return;
    const validFilters = filterEmptyQueryFilters(filters);
    if (validFilters.length === 0) return;

    await createSavedFilterMutation.mutateAsync({
      name: filterName.trim(),
      entries: validFilters.map((f) => ({
        column: f.column,
        operator: f.operator,
        value: f.value,
      })),
    });
    setFilterName('');
    onOpenChange(false);
  }, [filterName, filters, createSavedFilterMutation, onOpenChange]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setFilterName('');
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[320px]'>
        <DialogHeader>
          <DialogTitle>{t('selector.saveFiltersTitle')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <Input
            placeholder={t('selector.filterNamePlaceholder')}
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={() => onOpenChange(false)}>
              {t('selector.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!filterName.trim() || createSavedFilterMutation.isPending}>
              {createSavedFilterMutation.isPending ? (
                <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <SaveIcon className='mr-2 h-4 w-4' />
              )}
              {t('selector.saveFilters')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
