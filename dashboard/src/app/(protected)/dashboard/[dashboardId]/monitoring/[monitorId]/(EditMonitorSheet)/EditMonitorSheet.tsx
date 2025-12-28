'use client';

import { useState, useTransition, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { ConfirmDialog, DestructiveActionDialog } from '@/components/dialogs';
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { isHttpUrl } from '@/app/(protected)/dashboard/[dashboardId]/monitoring/utils';
import { useMonitorForm } from '../../shared/hooks/useMonitorForm';
import { useMonitorMutations } from './hooks/useMonitorMutations';
import { TimingSection, AlertsSection, AdvancedSettingsSection } from '../../shared/components';

type EditMonitorSheetProps = {
  dashboardId: string;
  monitor: MonitorCheck;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EditMonitorSheet({
  dashboardId,
  monitor,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditMonitorSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('monitoringEditDialog');
  const { data: session } = useSession();

  const { deleteMutation } = useMonitorMutations(dashboardId, monitor.id);
  const form = useMonitorForm({ mode: 'edit', monitor });

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        form.reset();
        setOpen(true);
        return;
      }
      if (form.isDirty) {
        setShowConfirmDialog(true);
      } else {
        setOpen(false);
      }
    },
    [form],
  );

  const handleConfirmDiscard = useCallback(() => {
    form.reset();
    setShowConfirmDialog(false);
    setOpen(false);
  }, [form]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        await updateMonitorCheckAction(dashboardId, form.buildUpdatePayload(monitor.id));
        toast.success(t('success'));
        form.markClean();
        setOpen(false);
        await queryClient.invalidateQueries({ queryKey: ['monitor', dashboardId, monitor.id] });
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  }, [dashboardId, monitor.id, form, t, queryClient]);

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
            <SheetHeader className='border-border space-y-0 border-b px-6 py-5'>
              <SheetTitle className='text-lg font-semibold'>{t('title')}</SheetTitle>
              <SheetDescription className='text-muted-foreground text-sm'>{monitor.url}</SheetDescription>
            </SheetHeader>

            <div className='flex-grow space-y-2 overflow-y-auto px-6 py-6'>
              <TimingSection form={form} isPending={isPending} defaultOpen={true} />
              <Separator />
              <AlertsSection
                form={form}
                isPending={isPending}
                userEmail={userEmail}
                sslMonitoringEnabled={sslMonitoringEnabled}
                defaultOpen={false}
              />
              <Separator />
              <AdvancedSettingsSection
                form={form}
                isPending={isPending}
                isHttpSite={isHttpSite}
                defaultOpen={false}
              />
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

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={t('confirmDiscard.title')}
        description={t('confirmDiscard.description')}
        cancelLabel={t('confirmDiscard.keep')}
        confirmLabel={t('confirmDiscard.discard')}
        onConfirm={handleConfirmDiscard}
      />

      <DestructiveActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('delete.title')}
        description={t('delete.description')}
        cancelLabel={t('delete.cancel')}
        confirmLabel={t('delete.confirm')}
        pendingLabel={t('delete.deleting')}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
