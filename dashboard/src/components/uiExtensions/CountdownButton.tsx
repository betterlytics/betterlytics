'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NumberFlow from '@number-flow/react';
import { useCountdown } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';
import React from 'react';

type CountdownButtonProps = Omit<React.ComponentPropsWithRef<typeof Button>, 'disabled'> & {
  /** Number of seconds the countdown should last. If undefined or 0, no countdown is shown. */
  countdownSeconds?: number;
  /** Whether the button action is currently pending (loading state). */
  isPending?: boolean;
  /** Whether the countdown timer is actively running. Typically tied to dialog open state. */
  isCountdownActive: boolean;
  /** Label to show when isPending is true */
  pendingLabel?: React.ReactNode;
};

function CountdownButton({
  className,
  variant = 'destructive',
  isPending = false,
  isCountdownActive,
  countdownSeconds,
  pendingLabel,
  children,
  ref,
  ...props
}: CountdownButtonProps) {
  const hasCountdown = countdownSeconds != null && countdownSeconds > 0;

  const { countdown, isFinished: canConfirm } = useCountdown({
    initialValue: countdownSeconds ?? 0,
    isRunning: hasCountdown && isCountdownActive,
  });

  const isDisabled = isPending || (hasCountdown && !canConfirm);

  const baseClasses =
    '!bg-destructive/85 hover:!bg-destructive/80 dark:!bg-destructive/65 dark:hover:!bg-destructive/80 cursor-pointer !text-white';

  return (
    <Button ref={ref} variant={variant} disabled={isDisabled} className={cn(baseClasses, className)} {...props}>
      {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
      {isPending ? (
        (pendingLabel ?? children)
      ) : hasCountdown && !canConfirm ? (
        <>
          {children} <NumberFlow value={countdown} prefix='(' suffix=')' willChange className='tabular-nums' />
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export { CountdownButton };
