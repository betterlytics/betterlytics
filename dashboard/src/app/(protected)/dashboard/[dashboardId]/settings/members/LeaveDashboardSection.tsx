'use client';

import { useState } from 'react';
import { leaveDashboardAction } from '@/app/actions/dashboard/members.action';
import { Button } from '@/components/ui/button';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { DestructiveActionDialog } from '@/components/dialogs';

export function LeaveDashboardSection() {
  const dashboardId = useDashboardId();
  const [isPendingLeave, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const router = useBARouter();

  const leaveDashboard = () => {
    startTransition(async () => {
      try {
        await leaveDashboardAction(dashboardId);
        toast.success('Left dashboard');
        router.replace('/dashboards');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to leave dashboard');
      }
    });
  };

  return (
    <div className='bg-card flex items-center justify-between space-y-4 rounded-xl border p-4 shadow'>
      <div>
        <div className='text-md font-semibold'>Leave Dashboard</div>
        <p className='text-muted-foreground text-xs'>Are you sure you want to leave this dashboard?</p>
      </div>
      <Button
        variant='ghost'
        className='text-destructive hover:text-destructive/80'
        onClick={() => setIsDialogOpen(true)}
        disabled={isPendingLeave}
      >
        {isPendingLeave ? 'Leaving...' : 'Leave Dashboard'}
      </Button>

      <DestructiveActionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title='Leave Dashboard'
        description='Are you sure you want to leave this dashboard? You will no longer be able to access it, and will need to be reinvited to join it again.'
        cancelLabel='Cancel'
        confirmLabel='Leave Dashboard'
        onConfirm={leaveDashboard}
        isPending={isPendingLeave}
        countdownSeconds={5}
        showIcon
      />
    </div>
  );
}
