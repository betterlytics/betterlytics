'use client';

import { deleteDashboardAction } from '@/app/actions';
import SettingsCard from '@/components/SettingsCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DashboardSettingsUpdate } from '@/entities/dashboardSettings';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useBARouter } from '@/hooks/use-ba-router';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type DangerZoneSettingsProps = {
  formData: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
};

export default function DangerZoneSettings({}: DangerZoneSettingsProps) {
  const dashboardId = useDashboardId();
  const router = useBARouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const t = useTranslations('components.dashboardSettingsDialog.danger');

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

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' className='w-full sm:w-auto'>
              <Trash2 className='h-4 w-4' />
              {t('deleteButton')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='text-destructive h-5 w-5' />
                {t('dialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>{t('dialog.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDashboard}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                {t('dialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsCard>
  );
}
