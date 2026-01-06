'use client';

import { useState } from 'react';
import { leaveDashboardAction } from '@/app/actions/dashboard/members.action';
import { Button } from '@/components/ui/button';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useTranslations } from 'next-intl';

export function LeaveDashboardSection() {
  const dashboardId = useDashboardId();
  const [isPendingLeave, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const t = useTranslations('components.dashboardSettingsDialog.leaveDashboard');

  const router = useBARouter();

  const leaveDashboard = () => {
    startTransition(async () => {
      try {
        await leaveDashboardAction(dashboardId);
        toast.success(t('toast.success'));
        router.replace('/dashboards');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.error'));
      }
    });
  };

  return (
    <div className='flex items-center justify-between'>
      <div>
        <span className='text-sm font-medium'>{t('title')}</span>
        <p className='text-muted-foreground text-xs'>{t('description')}</p>
      </div>
      <Button
        variant='ghost'
        className='text-destructive hover:text-destructive/80 cursor-pointer'
        onClick={() => setIsDialogOpen(true)}
        disabled={isPendingLeave}
      >
        {isPendingLeave ? t('buttonPending') : t('button')}
      </Button>

      <DestructiveActionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={t('dialog.title')}
        description={t('dialog.description')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.confirm')}
        onConfirm={leaveDashboard}
        isPending={isPendingLeave}
        showIcon
      />
    </div>
  );
}
