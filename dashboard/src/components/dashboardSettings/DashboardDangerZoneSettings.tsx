'use client';

import { deleteDashboardAction } from '@/app/actions/index.actions';
import SettingsCard from '@/components/SettingsCard';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useBARouter } from '@/hooks/use-ba-router';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function DangerZoneSettings() {
  const dashboardId = useDashboardId();
  const router = useBARouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const t = useTranslations('components.dashboardSettingsDialog.danger');
  const [isPending, startTransition] = useTransition();

  const handleDeleteDashboard = async () => {
    startTransition(async () => {
      try {
        await deleteDashboardAction(dashboardId);
        toast.success(t('deleteButton'));
        router.push('/dashboards');
      } catch (error) {
        console.error('Failed to delete dashboard:', error);
        toast.error(t('dialog.confirm'));
      }
    });
  };

  return (
    <SettingsCard icon={Trash2} title={t('title')} description={t('description')}>
      <div className='space-y-4'>
        <div className='border-destructive/20 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4'>
          <AlertTriangle className='text-destructive h-5 w-5 flex-shrink-0' />
          <div className='text-sm'>
            <p className='text-destructive font-medium'>{t('warning')}</p>
          </div>
        </div>

        <Button
          variant='destructive'
          onClick={() => setIsDialogOpen(true)}
          className='hover:bg-destructive/80 dark:hover:bg-destructive/80 bg-destructive/85 w-full cursor-pointer sm:w-auto'
        >
          <Trash2 className='h-4 w-4' />
          {t('deleteButton')}
        </Button>

        <DestructiveActionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={t('dialog.title')}
          description={t('dialog.description')}
          cancelLabel={t('dialog.cancel')}
          confirmLabel={t('dialog.confirm')}
          onConfirm={handleDeleteDashboard}
          isPending={isPending}
          countdownSeconds={5}
          showIcon
        />
      </div>
    </SettingsCard>
  );
}
