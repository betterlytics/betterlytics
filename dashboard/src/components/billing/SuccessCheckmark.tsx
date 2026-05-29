'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SuccessCheckmarkProps {
  label?: string;
  description?: string;
  className?: string;
}

const CIRCLE_CIRCUMFERENCE = 151;
const CHECK_PATH_LENGTH = 40;

const CIRCLE_DRAW_MS = 700;
const CHECK_DRAW_MS = 300;
const CHECK_DELAY_MS = CIRCLE_DRAW_MS;
const LABEL_DELAY_MS = CIRCLE_DRAW_MS + CHECK_DRAW_MS;
const POLISH_DELAY_MS = LABEL_DELAY_MS;

export function SuccessCheckmark({ label, description, className }: SuccessCheckmarkProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Defer one frame so the initial (offset-hidden) state paints before the transition triggers
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn('flex flex-col items-center justify-center gap-3 py-6', className)}
    >
      <style>{`
        @keyframes successCheckmarkBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes successCheckmarkPulse {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>
      <svg
        viewBox='0 0 52 52'
        className='h-16 w-16 text-emerald-500'
        style={{
          transformOrigin: 'center',
          animation: animate
            ? `successCheckmarkBounce 320ms cubic-bezier(0.34, 1.56, 0.64, 1) ${POLISH_DELAY_MS}ms both`
            : 'none',
        }}
      >
        <circle
          cx='26'
          cy='26'
          r='24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          style={{
            transformOrigin: 'center',
            animation: animate ? `successCheckmarkPulse 700ms ease-out ${POLISH_DELAY_MS}ms both` : 'none',
            opacity: 0,
          }}
        />
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
        <path
          d='M14 27 L23 36 L40 18'
          fill='none'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeDasharray={CHECK_PATH_LENGTH}
          strokeDashoffset={animate ? 0 : CHECK_PATH_LENGTH}
          style={{
            transition: `stroke-dashoffset ${CHECK_DRAW_MS}ms ease-out ${CHECK_DELAY_MS}ms`,
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
          className='animate-in fade-in text-muted-foreground -mt-1 text-sm'
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
