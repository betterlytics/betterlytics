'use client';

import { cn } from '@/lib/utils';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

export type StatusCheckmarkVariant = 'success' | 'failure';

interface StatusCheckmarkProps {
  variant: StatusCheckmarkVariant;
  label?: string;
  description?: string;
  className?: string;
}

const CIRCLE_CIRCUMFERENCE = 151;
const CHECK_PATH_LENGTH = 40;
const X_LINE_LENGTH = 32;
const CIRCLE_DRAW_MS = 700;

const VARIANTS = {
  success: { colorClass: 'text-emerald-500', glyphDrawMs: 300, polish: true, centerDescription: false },
  failure: { colorClass: 'text-destructive', glyphDrawMs: 250, polish: false, centerDescription: true },
} as const;

export function StatusCheckmark({ variant, label, description, className }: StatusCheckmarkProps) {
  const animate = useEntranceAnimation();
  const cfg = VARIANTS[variant];
  const glyphDelayMs = CIRCLE_DRAW_MS;
  const labelDelayMs = CIRCLE_DRAW_MS + cfg.glyphDrawMs;

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn('flex flex-col items-center justify-center gap-3 py-6', className)}
    >
      {cfg.polish && (
        <style>{`
          @keyframes statusCheckmarkBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          @keyframes statusCheckmarkPulse {
            0% { transform: scale(1); opacity: 0.55; }
            100% { transform: scale(1.55); opacity: 0; }
          }
        `}</style>
      )}
      <svg
        viewBox='0 0 52 52'
        className={cn('h-16 w-16', cfg.colorClass)}
        style={
          cfg.polish
            ? {
                transformOrigin: 'center',
                animation: animate
                  ? `statusCheckmarkBounce 320ms cubic-bezier(0.34, 1.56, 0.64, 1) ${labelDelayMs}ms both`
                  : 'none',
              }
            : undefined
        }
      >
        {cfg.polish && (
          <circle
            cx='26'
            cy='26'
            r='24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            style={{
              transformOrigin: 'center',
              animation: animate ? `statusCheckmarkPulse 700ms ease-out ${labelDelayMs}ms both` : 'none',
              opacity: 0,
            }}
          />
        )}
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
        {variant === 'success' ? (
          <path
            d='M14 27 L23 36 L40 18'
            fill='none'
            stroke='currentColor'
            strokeWidth='3'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeDasharray={CHECK_PATH_LENGTH}
            strokeDashoffset={animate ? 0 : CHECK_PATH_LENGTH}
            style={{ transition: `stroke-dashoffset ${cfg.glyphDrawMs}ms ease-out ${glyphDelayMs}ms` }}
          />
        ) : (
          <>
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
              style={{ transition: `stroke-dashoffset ${cfg.glyphDrawMs}ms ease-out ${glyphDelayMs}ms` }}
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
              style={{ transition: `stroke-dashoffset ${cfg.glyphDrawMs}ms ease-out ${glyphDelayMs}ms` }}
            />
          </>
        )}
      </svg>

      {label && (
        <p
          className='animate-in fade-in slide-in-from-bottom-1 text-base font-semibold'
          style={{ animationDelay: `${labelDelayMs}ms`, animationDuration: '300ms', animationFillMode: 'both' }}
        >
          {label}
        </p>
      )}
      {description && (
        <p
          className={cn(
            'animate-in fade-in text-muted-foreground -mt-1 text-sm',
            cfg.centerDescription && 'text-center',
          )}
          style={{
            animationDelay: `${labelDelayMs + 100}ms`,
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
