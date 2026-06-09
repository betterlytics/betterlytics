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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
        className={cn(
          'bg-background rounded-none flex flex-col [&>button]:cursor-pointer p-4 sm:p-5 lg:p-6',
          'w-screen h-dvh !max-w-none border-0',
          'windowed:w-[90dvw] windowed:h-auto windowed:max-h-[85dvh] windowed:!max-w-[92rem] windowed:rounded-lg windowed:border',
        )}
        onAnimationEnd={onAnimationEnd}
      >
        <DialogHeader className='pb-2'>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <Separator />
        <DialogFooter className='flex flex-row justify-end gap-2'>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
