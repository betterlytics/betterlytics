'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FailureCheckmarkProps {
  label?: string;
  description?: string;
  className?: string;
}

const CIRCLE_CIRCUMFERENCE = 151;
const X_LINE_LENGTH = 32;

const CIRCLE_DRAW_MS = 700;
const X_DRAW_MS = 250;
const X_DELAY_MS = CIRCLE_DRAW_MS;
const LABEL_DELAY_MS = CIRCLE_DRAW_MS + X_DRAW_MS;

export function FailureCheckmark({ label, description, className }: FailureCheckmarkProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn('flex flex-col items-center justify-center gap-3 py-6', className)}
    >
      <svg viewBox='0 0 52 52' className='text-destructive h-16 w-16'>
        <circle
          cx='26'
          cy='26'
          r='24'
          fill='none'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={animate ? 0 : CIRCLE_CIRCUMFERENCE}
          style={{ transition: `stroke-dashoffset ${CIRCLE_DRAW_MS}ms ease-out` }}
        />
        <line
          x1='18'
          y1='18'
          x2='34'
          y2='34'
          fill='none'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeDasharray={X_LINE_LENGTH}
          strokeDashoffset={animate ? 0 : X_LINE_LENGTH}
          style={{
            transition: `stroke-dashoffset ${X_DRAW_MS}ms ease-out ${X_DELAY_MS}ms`,
          }}
        />
        <line
          x1='34'
          y1='18'
          x2='18'
          y2='34'
          fill='none'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeDasharray={X_LINE_LENGTH}
          strokeDashoffset={animate ? 0 : X_LINE_LENGTH}
          style={{
            transition: `stroke-dashoffset ${X_DRAW_MS}ms ease-out ${X_DELAY_MS}ms`,
          }}
        />
      </svg>

      {label && (
        <p
          className='animate-in fade-in slide-in-from-bottom-1 text-base font-semibold'
          style={{
            animationDelay: `${LABEL_DELAY_MS}ms`,
            animationDuration: '300ms',
            animationFillMode: 'both',
          }}
        >
          {label}
        </p>
      )}
      {description && (
        <p
          className='animate-in fade-in text-muted-foreground -mt-1 text-center text-sm'
          style={{
            animationDelay: `${LABEL_DELAY_MS + 100}ms`,
            animationDuration: '300ms',
            animationFillMode: 'both',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
