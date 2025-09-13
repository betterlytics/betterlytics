'use client';

import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { postFunnelAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCallback, useState, useMemo, ComponentProps, useEffect } from 'react';
import { Plus, PlusIcon } from 'lucide-react';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { FunnelPreviewDisplay } from './FunnelPreviewDisplay';
import { fetchFunnelPreviewAction } from '@/app/actions/funnels';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';
import { useTranslations } from 'next-intl';

type FunnelMetadata = {
  name: string;
  isStrict: boolean;
};

type CreateFunnelDialogProps = {
  triggerText?: string;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
};

export function CreateFunnelDialog({ triggerText, triggerVariant }: CreateFunnelDialogProps) {
  const dashboardId = useDashboardId();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('components.funnels.create');

  const [metadata, setMetadata] = useState<FunnelMetadata>({
    name: t('defaultName'),
    isStrict: false,
  });

  const { queryFilters, addEmptyQueryFilter, updateQueryFilter, removeQueryFilter } = useQueryFilters();

  useEffect(() => {
    if (queryFilters.length === 0) {
      addEmptyQueryFilter();
    }
  }, [queryFilters]);

  const processedQueryFilters = useMemo(() => {
    return queryFilters.map((p) => p.value).filter((p) => p.trim() !== '');
  }, [queryFilters]);

  const debouncedFunnelPages = useDebounce(processedQueryFilters, 500);

  const isPreviewEnabled = debouncedFunnelPages.length >= 2;

  const { data: funnelPreviewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['funnelPreview', dashboardId, queryFilters, metadata.isStrict],
    queryFn: async () => {
      return fetchFunnelPreviewAction(dashboardId, queryFilters, metadata.isStrict);
    },
    enabled: isPreviewEnabled,
  });

  const submit = useCallback(() => {
    postFunnelAction(dashboardId, metadata.name, queryFilters, metadata.isStrict)
      .then(() => {
        toast.success(t('successMessage'));
        setIsOpen(false);
      })
      .catch(() => toast.error(t('errorMessage')));
  }, [metadata, queryFilters, dashboardId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant || 'secondary'} className='cursor-pointer border'>
          <Plus className='size-5' />
          {triggerText || t('createFunnel')}
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex h-[70dvh] w-[80dvw] !max-w-[1250px] flex-col'>
        <DialogHeader>
          <DialogTitle>{t('createFunnelLower')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row'>
          <div className='flex h-full flex-col overflow-hidden lg:max-w-2xl'>
            <div className='flex items-start justify-between gap-4 pb-4'>
              <div className='h-full'>
                <Label htmlFor='name' className='text-foreground mb-1 block'>
                  {t('name')}
                </Label>
                <Input
                  id='name'
                  placeholder={t('namePlaceholder')}
                  className='bg-input placeholder:text-muted-foreground w-full'
                  value={metadata.name}
                  onChange={(evt) => setMetadata((prev) => ({ ...prev, name: evt.target.value }))}
                />
              </div>
              <div className='h-full' title='If active, steps must occur right after each other'>
                <Label htmlFor='strict-mode' className='text-foreground mb-1 block'>
                  {t('strictMode')}
                </Label>
                <div className='flex h-9 flex-grow items-center justify-center'>
                  <Switch
                    id='strict-mode'
                    className='bg-input placeholder:text-muted-foreground my-auto cursor-pointer'
                    checked={metadata.isStrict}
                    onCheckedChange={(checked: boolean) => setMetadata((prev) => ({ ...prev, isStrict: checked }))}
                  />
                </div>
              </div>
            </div>
            <div className='scrollbar-thin bg-card flex-1 overflow-y-auto rounded-lg p-4 shadow'>
              <div className='space-y-2'>
                {queryFilters.map((filter) => (
                  <QueryFilterInputRow
                    key={filter.id}
                    onFilterUpdate={updateQueryFilter}
                    filter={filter}
                    requestRemoval={(_filter) => removeQueryFilter(_filter.id)}
                  />
                ))}
                <div className='mt-auto'>
                  <Button
                    variant='outline'
                    onClick={addEmptyQueryFilter}
                    className='cursor-pointer whitespace-nowrap'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' /> {t('addStep')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-card flex h-full flex-grow flex-col overflow-hidden rounded-lg p-4 shadow'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-card-foreground text-lg font-semibold'>{t('livePreview')}</h3>
            </div>
            <div className='scrollbar-thin flex-1 overflow-y-auto'>
              <FunnelPreviewDisplay
                funnelDetails={funnelPreviewData}
                funnelName={metadata.name}
                isLoading={isPreviewLoading}
              />
            </div>
          </div>
        </div>
        <DialogFooter className='mt-auto pt-2'>
          <Button type='submit' onClick={submit} disabled={queryFilters.length < 2} className='cursor-pointer'>
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
