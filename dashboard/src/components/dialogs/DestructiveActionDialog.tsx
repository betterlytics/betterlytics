'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';

type DestructiveActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  countdownSeconds?: number;
  showIcon?: boolean;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
};

export function DestructiveActionDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  pendingLabel,
  onConfirm,
  isPending = false,
  countdownSeconds,
  showIcon = false,
  children,
  onClick,
}: DestructiveActionDialogProps) {
  const t = useTranslations('misc');

  const resolvedConfirmLabel = confirmLabel ?? t('delete');
  const resolvedPendingLabel = pendingLabel ?? t('deleting');
  const resolvedCancelLabel = cancelLabel ?? t('cancel');

  const hasCountdown = countdownSeconds != null && countdownSeconds > 0;
  const { countdown, isFinished: canConfirm } = useCountdown({
    initialValue: countdownSeconds ?? 0,
    isRunning: hasCountdown && open,
  });

  const isConfirmDisabled = isPending || (hasCountdown && !canConfirm);

  const buttonLabel = (() => {
    if (isPending) return resolvedPendingLabel;
    if (hasCountdown && !canConfirm) return `${resolvedConfirmLabel} (${countdown})`;
    return resolvedConfirmLabel;
  })();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={onClick}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(showIcon && 'flex items-center gap-2')}>
            {showIcon && <AlertTriangle className='text-destructive h-5 w-5' />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
            {resolvedCancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant='destructive'
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className='cursor-pointer'
            >
              {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
              {buttonLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
