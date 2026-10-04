'use client';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';

type MonitorDeleteDialogProps = {
  dashboardId: string;
  monitorId: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function MonitorDeleteDialog({
  dashboardId,
  monitorId,
  onOpenChange,
  onConfirm,
  isPending,
}: MonitorDeleteDialogProps) {
  const t = useTranslations('monitoringPage.actions');
  const tMisc = useTranslations('misc');

  const impact = trpc.monitors.deletionImpact.useQuery(
    { dashboardId, monitorId },
    { staleTime: 0, gcTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: false, retry: false },
  );
  const checking = impact.isPending || impact.isFetching;
  const canDelete = !checking && (impact.isSuccess || impact.isError) && !isPending;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>

        <div aria-live='polite' className='text-sm'>
          {checking ? (
            <p role='status' className='text-muted-foreground flex items-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' aria-hidden />
              {t('deleteImpactLoading')}
            </p>
          ) : impact.isError ? (
            <div role='alert' className='space-y-3 rounded-lg border border-amber-500/45 bg-amber-500/7 px-4 py-3'>
              <p className='flex items-start gap-2 font-medium'>
                <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-500' aria-hidden />
                {t('deleteImpactError')}
              </p>
              <p className='text-muted-foreground'>{t('deleteImpactUnknownWarning')}</p>
              <Button
                variant='outline'
                size='sm'
                disabled={isPending}
                onClick={() => void impact.refetch()}
                className='cursor-pointer'
              >
                {t('deleteImpactRetry')}
              </Button>
            </div>
          ) : impact.data && impact.data.length > 0 ? (
            <div className='space-y-2'>
              <p className='font-medium'>{t('deleteImpactAffectedPages')}</p>
              <ul className='max-h-60 space-y-2 overflow-y-auto'>
                {impact.data.map((page) => (
                  <li key={page.id} className='rounded-md border px-3 py-2'>
                    <span className='font-medium break-words'>{page.name}</span>
                    {page.willBeEmpty && (
                      <p className='mt-1 flex items-start gap-2 text-amber-600 dark:text-amber-400'>
                        <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
                        {t('deleteImpactEmptyWarning')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
            {tMisc('cancel')}
          </AlertDialogCancel>
          {/* A plain Button rather than AlertDialogAction so the dialog stays open until the mutation succeeds */}
          <Button
            variant='destructive'
            disabled={!canDelete}
            onClick={() => {
              if (canDelete) onConfirm();
            }}
            className='!bg-destructive/85 hover:!bg-destructive/80 dark:!bg-destructive/65 dark:hover:!bg-destructive/80 cursor-pointer !text-white'
          >
            {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
            {isPending ? tMisc('deleting') : tMisc('delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
