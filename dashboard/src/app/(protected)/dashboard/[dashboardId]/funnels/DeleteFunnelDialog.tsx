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

type DeleteFunnelDialogProps = {
  funnel: PresentedFunnel;
};

export function DeleteFunnelDialog({ funnel }: DeleteFunnelDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer'>
          <Trash2 className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex h-[90dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>Delete funnel</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this funnel? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex flex-1 items-end justify-end gap-2'>
          <Button variant='secondary' className='w-30 cursor-pointer'>
            Cancel
          </Button>
          <Button variant='destructive' className='w-30 cursor-pointer'>
            Delete funnel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
