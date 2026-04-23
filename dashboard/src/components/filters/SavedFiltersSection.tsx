'use client';

import { useCallback, useState, Dispatch } from 'react';
import { ChevronDownIcon, Trash2Icon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSavedFilters, useDeleteSavedFilter, useRestoreSavedFilter } from '@/hooks/use-saved-filters';
import { type SavedFilter } from '@/entities/analytics/savedFilters.entities';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PermissionGate } from '../tooltip/PermissionGate';

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
        values: entry.values,
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
    <PermissionGate allowViewer>
      {(disabled) => (
        <div className={cn(isMobile ? 'pt-1' : 'pt-2')}>
          <Separator />
          <Collapsible
            className={cn('group', isMobile ? 'pt-1' : 'pt-2')}
            disabled={disabled}
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
            <CollapsibleContent>
              <div className='grid grid-rows-[minmax(0,40vh)]'>
                <ScrollArea
                  className='h-full'
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  <div className='border-border/50 ml-2 space-y-1 border-l pt-1 pl-2'>
              {savedFilters.map((savedFilter) => (
                <div
                  key={savedFilter.id}
                  className='hover:bg-accent flex items-center rounded-md transition-colors'
                >
                  <button
                    type='button'
                    className='focus-visible:ring-ring/50 flex-1 cursor-pointer truncate rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-[2px]'
                    onClick={() => handleLoad(savedFilter)}
                  >
                    {savedFilter.name}
                  </button>
                  <PermissionGate>
                    {(disabled) => (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='dark:hover:bg-muted/50 hover:bg-foreground/10 h-6 w-6 cursor-pointer px-4 mr-3'
                        onClick={(e) => handleDelete(savedFilter.id, e)}
                        disabled={disabled || deletingFilterId === savedFilter.id}
                      >
                        {deletingFilterId === savedFilter.id ? (
                          <Loader2Icon className='h-3.5 w-3.5 animate-spin' />
                        ) : (
                          <Trash2Icon className='h-3.5 w-3.5' />
                        )}
                      </Button>
                    )}
                  </PermissionGate>
                </div>
              ))}
                  </div>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </PermissionGate>
  );
}
