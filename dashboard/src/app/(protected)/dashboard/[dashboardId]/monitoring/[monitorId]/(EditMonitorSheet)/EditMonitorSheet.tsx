'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { updateMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { isHttpUrl } from '@/app/(protected)/dashboard/[dashboardId]/monitoring/utils';
import { useMonitorForm } from './hooks/useMonitorForm';
import { useMonitorMutations } from './hooks/useMonitorMutations';
import { TimingSection } from './components/TimingSection';
import { AlertsSection } from './components/AlertsSection';
import { AdvancedSettingsSection } from './components/AdvancedSettingsSection';

type EditMonitorDialogProps = {
  dashboardId: string;
  monitor: MonitorCheck;
  trigger?: React.ReactNode;
};

export function EditMonitorDialog({ dashboardId, monitor, trigger }: EditMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('monitoringEditDialog');
  const { data: session } = useSession();

  const { deleteMutation } = useMonitorMutations(dashboardId, monitor.id);
  const form = useMonitorForm(monitor, open);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && form.isDirty) {
        setShowConfirmDialog(true);
      } else {
        setOpen(newOpen);
      }
    },
    [form.isDirty],
  );

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    setOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        await updateMonitorCheckAction(
          dashboardId,
          form.buildUpdatePayload(monitor.id, monitor.name ?? null, monitor.isEnabled),
        );
        toast.success(t('success'));
        form.resetToCurrentState();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  }, [dashboardId, monitor.id, monitor.name, monitor.isEnabled, form, t, router]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setOpen(false);
      },
    });
  }, [deleteMutation]);

  const userEmail = session?.user?.email;
  const sslMonitoringEnabled = !isHttpUrl(monitor.url) && form.state.checkSslErrors;
  const isHttpSite = !monitor.url.startsWith('https://');

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{trigger ?? <Button size='sm'>{t('trigger')}</Button>}</SheetTrigger>
        <SheetContent side='right' className='w-full max-w-2xl overflow-y-auto p-0 sm:max-w-4xl'>
          <div className='flex h-full flex-col'>
            <SheetHeader className='border-border space-y-1 border-b px-6 py-5'>
              <SheetTitle className='text-lg font-semibold'>{t('sheet.title')}</SheetTitle>
              <SheetDescription className='text-muted-foreground text-sm'>
                {t('sheet.description', { url: '' })}{' '}
                <span className='text-foreground font-medium'>{monitor.url}</span>
              </SheetDescription>
            </SheetHeader>

            <div className='flex-grow space-y-8 overflow-y-auto px-6 py-6'>
              <TimingSection form={form} isPending={isPending} />
              <Separator />
              <AlertsSection
                form={form}
                isPending={isPending}
                userEmail={userEmail}
                sslMonitoringEnabled={sslMonitoringEnabled}
              />
              <Separator />
              <AdvancedSettingsSection form={form} isPending={isPending} isHttpSite={isHttpSite} />
            </div>

            <div className='border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 flex items-center justify-between gap-3 border-t px-6 py-4 backdrop-blur'>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isPending || deleteMutation.isPending}
                  className='text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5'
                >
                  <Trash2 className='h-4 w-4' aria-hidden />
                  <span>{t('delete.trigger')}</span>
                </Button>
                {form.isDirty && (
                  <>
                    <div className='h-2 w-2 animate-pulse rounded-full bg-amber-500' />
                    <span className='text-muted-foreground text-xs'>{t('unsavedChanges')}</span>
                  </>
                )}
              </div>
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                  className='cursor-pointer'
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  type='button'
                  onClick={handleSave}
                  disabled={isPending || !form.isDirty}
                  className='min-w-[100px] cursor-pointer'
                >
                  {isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDiscard.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDiscard.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirmDiscard.keep')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>{t('confirmDiscard.discard')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {deleteMutation.isPending ? t('delete.deleting') : t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
