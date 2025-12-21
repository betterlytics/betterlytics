'use client';

import { useCallback, useState, Dispatch } from 'react';
import { ChevronDownIcon, Trash2Icon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSavedFilters, useDeleteSavedFilter, useRestoreSavedFilter } from '@/hooks/use-saved-filters';
import { type SavedFilter } from '@/entities/analytics/savedFilters.entities';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { DisabledDemoTooltip } from '@/components/tooltip/DisabledDemoTooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type SavedFiltersSectionProps = {
  onLoadFilter: Dispatch<QueryFilter[]>;
  isOpen: boolean;
  onOpenChange: Dispatch<boolean>;
};

export function SavedFiltersSection({ onLoadFilter, isOpen, onOpenChange }: SavedFiltersSectionProps) {
  const t = useTranslations('components.filters');
  const isMobile = useIsMobile();
  const [deletingFilterId, setDeletingFilterId] = useState<string | null>(null);

  const { data: savedFilters = [], isLoading } = useSavedFilters();
  const deleteMutation = useDeleteSavedFilter();
  const restoreMutation = useRestoreSavedFilter();

  const handleLoad = useCallback(
    (savedFilter: SavedFilter) => {
      const filters: QueryFilter[] = savedFilter.entries.map((entry, index) => ({
        id: `loaded-${savedFilter.id}-${index}`,
        column: entry.column,
        operator: entry.operator,
        value: entry.value,
      }));
      onLoadFilter(filters);
    },
    [onLoadFilter],
  );

  const handleDelete = useCallback(
    async (filterId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingFilterId(filterId);
      try {
        await deleteMutation.mutateAsync(filterId);
        toast.success(t('selector.toastFilterDeletedSuccess'), {
          action: {
            label: t('selector.toastUndo'),
            onClick: () => restoreMutation.mutate(filterId),
          },
        });
      } catch {
        toast.error(t('selector.toastFilterDeletedError'));
      } finally {
        setDeletingFilterId(null);
      }
    },
    [deleteMutation, restoreMutation, t],
  );

  if (isLoading || savedFilters.length === 0) {
    return null;
  }

  return (
    <DisabledDemoTooltip>
      {(isDemo) => (
        <div className={cn(isMobile ? 'pt-1' : 'pt-2')}>
          <Separator />
          <Collapsible
            className={cn('group', isMobile ? 'pt-1' : 'pt-1')}
            disabled={isDemo}
            open={isOpen}
            onOpenChange={onOpenChange}
          >
            <CollapsibleTrigger asChild>
              <Button variant='ghost' className='h-8 w-full cursor-pointer justify-between px-2'>
                <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                  {t('selector.savedFilters')}
                  <Badge variant='outline' className='h-5 w-5 rounded-full p-0 text-xs'>
                    {savedFilters.length}
                  </Badge>
                </span>
                <ChevronDownIcon className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]:rotate-180' />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className='border-border/50 ml-2 space-y-1 border-l pt-1 pl-2'>
              {savedFilters.map((savedFilter) => (
                <div
                  key={savedFilter.id}
                  className={`hover:bg-accent flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-colors`}
                  onClick={() => handleLoad(savedFilter)}
                >
                  <span className='truncate text-sm'>{savedFilter.name}</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='dark:hover:bg-muted/50 hover:bg-foreground/10 h-6 w-6 cursor-pointer px-4'
                    onClick={(e) => handleDelete(savedFilter.id, e)}
                    disabled={deletingFilterId === savedFilter.id}
                  >
                    {deletingFilterId === savedFilter.id ? (
                      <Loader2Icon className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      <Trash2Icon className='h-3.5 w-3.5' />
                    )}
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </DisabledDemoTooltip>
  );
}
