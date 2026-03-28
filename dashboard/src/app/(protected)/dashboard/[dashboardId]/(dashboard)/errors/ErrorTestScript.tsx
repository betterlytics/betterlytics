'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

export function ErrorTestScript() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function throwUncaughtError() {
    setTimeout(() => {
      throw new Error('Test uncaught error [error-replay]');
    }, 0);
  }

  function throwUnhandledRejection() {
    Promise.reject(new Error('Test unhandled rejection [error-replay]'));
  }

  function scheduleError(delaySeconds: number) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCountdown(delaySeconds);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimeout(() => {
            throw new Error(`Test error after ${delaySeconds}s delay [error-replay]`);
          }, 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return (
    <div className='border-border bg-muted/30 rounded-lg border p-3'>
      <p className='text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide'>Error replay test</p>
      <div className='flex flex-wrap items-center gap-2'>
        <Button size='sm' variant='outline' onClick={throwUncaughtError}>
          Throw error now
        </Button>
        <Button size='sm' variant='outline' onClick={throwUnhandledRejection}>
          Unhandled rejection
        </Button>
        <Button size='sm' variant='outline' onClick={() => scheduleError(30)}>
          Throw in 30s
        </Button>
        {countdown !== null && (
          <span className='text-muted-foreground text-sm tabular-nums'>Error in {countdown}s…</span>
        )}
      </div>
    </div>
  );
}
