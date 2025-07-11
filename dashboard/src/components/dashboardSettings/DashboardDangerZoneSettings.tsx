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
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';

type DangerZoneSettingsProps = {
  formData: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
};

export default function DangerZoneSettings({}: DangerZoneSettingsProps) {
  const dashboardId = useDashboardId();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteDashboard = async () => {
    startTransition(async () => {
      try {
        await deleteDashboardAction(dashboardId);
        toast.success('Dashboard deleted successfully');
        router.push('/dashboards');
      } catch (error) {
        console.error('Failed to delete dashboard:', error);
        toast.error('Failed to delete dashboard. Please try again.');
      }
    });
  };

  return (
    <SettingsCard icon={Trash2} title='Delete Dashboard' description={'Permanently delete dashboard'}>
      <div className='space-y-4'>
        <div className='border-destructive/20 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4'>
          <AlertTriangle className='text-destructive h-5 w-5 flex-shrink-0' />
          <div className='text-sm'>
            <p className='text-destructive font-medium'>Warning: This action cannot be undone</p>
          </div>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' className='w-full sm:w-auto'>
              <Trash2 className='h-4 w-4' />
              Delete Dashboard
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='text-destructive h-5 w-5' />
                Delete Dashboard
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this dashboard? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDashboard}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete Dashboard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsCard>
  );
}
