'use client';

import { deleteDashboardAction } from '@/app/actions/index.actions';
import SettingsSection from '@/app/(protected)/dashboard/[dashboardId]/(settings)/settings/SettingsSection';
import SettingsPageHeader from '@/app/(protected)/dashboard/[dashboardId]/(settings)/settings/SettingsPageHeader';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useBARouter } from '@/hooks/use-ba-router';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

export default function DangerZoneSettings() {
  const dashboardId = useDashboardId();
  const router = useBARouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const t = useTranslations('components.dashboardSettingsDialog.danger');
  const tSidebar = useTranslations('dashboard.settings.sidebar');
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
      <SettingsPageHeader title={tSidebar('dangerZone')} />

      <SettingsSection title={t('title')}>
        <div className='flex items-center justify-between'>
          <div>
            <span className='text-sm font-medium'>{t('sectionTitle')}</span>
            <p className='text-muted-foreground text-xs'>{t('sectionDescription')}</p>
          </div>
          <PermissionGate>
            {(disabled) => (
              <Button
                variant='ghost'
                onClick={() => setIsDialogOpen(true)}
                className='text-destructive hover:text-destructive/80 cursor-pointer'
                disabled={disabled}
              >
                {t('deleteButton')}
              </Button>
            )}
          </PermissionGate>
        </div>

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
