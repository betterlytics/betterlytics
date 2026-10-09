'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type AdminConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  destructive?: boolean;
  children?: ReactNode;
};

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
  destructive = false,
  children,
}: AdminConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
            Cancel
          </AlertDialogCancel>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={onConfirm}
            className='cursor-pointer'
          >
            {isPending && <Loader2 className='h-4 w-4 animate-spin' />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
