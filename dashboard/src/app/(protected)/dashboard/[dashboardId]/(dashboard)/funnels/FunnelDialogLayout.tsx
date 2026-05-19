'use client';

import type { ComponentProps, ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type FunnelDialogLayoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  footer: ReactNode;
  children: ReactNode;
  onAnimationEnd?: ComponentProps<typeof DialogContent>['onAnimationEnd'];
};

export function FunnelDialogLayout({
  open,
  onOpenChange,
  trigger,
  title,
  footer,
  children,
  onAnimationEnd,
}: FunnelDialogLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className='bg-background flex flex-col w-screen h-dvh max-w-none rounded-none border-0 sm:w-[80dvw] sm:h-auto sm:max-h-[90dvh] sm:!max-w-7xl sm:rounded-lg sm:border [&>button]:cursor-pointer'
        onAnimationEnd={onAnimationEnd}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter className='flex flex-row justify-end gap-2'>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
