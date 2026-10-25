'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ViewMessageDialogProps {
  title: string;
  message: string;
}

export function ViewMessageDialog({ title, message }: ViewMessageDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm'>
          View
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto'>
          <p className='text-sm break-all whitespace-pre-wrap'>{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
