'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useCallback, useState } from 'react';
import { deleteFunnelAction } from '@/app/actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';

type DeleteFunnelDialogProps = {
  funnel: PresentedFunnel;
};

export function DeleteFunnelDialog({ funnel }: DeleteFunnelDialogProps) {
  const dashboardId = useDashboardId();
  const [isOpen, setIsOpen] = useState(false);
  const deleteFunnel = useCallback(() => {
    deleteFunnelAction(dashboardId, funnel.id).then(() => {
      setIsOpen(false);
    });
  }, [dashboardId, funnel.id]);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer'>
          <Trash2 className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex flex-col'>
        <DialogHeader>
          <DialogTitle>Delete funnel</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this funnel? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex flex-1 items-end justify-end gap-2'>
          <Button variant='secondary' className='w-30 cursor-pointer' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant='destructive' className='w-30 cursor-pointer' onClick={() => deleteFunnel()}>
            Delete funnel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
