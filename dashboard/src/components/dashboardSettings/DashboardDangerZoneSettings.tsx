'use client';

import { deleteDashboardAction } from '@/app/actions/index.actions';
import SettingsSection from '@/components/SettingsSection';
import SettingsPageHeader from '@/components/SettingsPageHeader';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { Trash2 } from 'lucide-react';
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
        toast.success(t('toastSuccess'));
        router.push('/dashboards');
      } catch (error) {
        console.error('Failed to delete dashboard:', error);
        toast.error(t('toastError'));
      }
    });
  };

  return (
    <div>
      <SettingsPageHeader title={t('title')} />

      <SettingsSection title={t('title')} description={t('description')}>
        <Button variant='destructive' onClick={() => setIsDialogOpen(true)} className='cursor-pointer'>
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
      </SettingsSection>
    </div>
  );
}
