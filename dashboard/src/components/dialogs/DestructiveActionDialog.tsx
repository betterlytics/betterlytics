'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
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
import { CountdownButton } from '@/components/uiExtensions/CountdownButton';
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
            <CountdownButton
              onClick={onConfirm}
              isPending={isPending}
              isCountdownActive={open}
              countdownSeconds={countdownSeconds}
              pendingLabel={resolvedPendingLabel}
            >
              {resolvedConfirmLabel}
            </CountdownButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
