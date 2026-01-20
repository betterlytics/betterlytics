'use client';

import { cn } from '@/lib/utils';
import React, { useCallback } from 'react';
import { DIGITS, type DigitState } from './NumberRoll';

type DigitReelProps = {
  digitState: DigitState;
  onPhaseComplete: (id: string, action: 'completed' | 'exited') => void;
};

function DigitReelComponent({ digitState, onPhaseComplete }: DigitReelProps) {
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== e.currentTarget) return;

      if (e.animationName.includes('digit-exit')) {
        onPhaseComplete(digitState.id, 'exited');
      } else if (e.animationName.includes('digit-enter')) {
        onPhaseComplete(digitState.id, 'completed');
      }
    },
    [onPhaseComplete, digitState.id],
  );

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target !== e.currentTarget) return;
      if (digitState.phase === 'animating' && e.propertyName === 'transform') {
        onPhaseComplete(digitState.id, 'completed');
      }
    },
    [onPhaseComplete, digitState.phase, digitState.id],
  );

  return (
    <span
      className={cn(
        'digit-reel-wrapper inline-flex items-start justify-center',
        'motion-reduce:[--reduced-duration:0ms]',
      )}
      data-phase={digitState.phase}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleTransitionEnd}
    >
      <span className={cn('digit-reel-mask inline-flex items-start justify-center')}>
        <span
          className={cn('digit-reel-inner inline-flex flex-col items-center justify-center', `w-[--digit-width]`)}
          style={{ '--target-offset': `${-digitState.digit * 10}%` } as React.CSSProperties}
          data-phase={digitState.phase}
        >
          {DIGITS.map((d) => (
            <span
              key={d}
              className={cn(
                'digit-reel-digit',
                d !== digitState.digit && 'select-none'
              )}
            >
              {d}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
