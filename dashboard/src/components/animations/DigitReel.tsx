'use client';

import { cn } from '@/lib/utils';
import React, { useCallback } from 'react';
import { DIGITS, useAnimatedConfig, type DigitState } from './context';

type DigitReelProps = {
  digitState: DigitState;
};

function DigitReelComponent({ digitState }: DigitReelProps) {
  const { dispatch } = useAnimatedConfig();

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== e.currentTarget) return; // Ignore bubbles

      if (e.animationName.includes('digit-exit')) {
        dispatch({ type: 'exited', id: digitState.id });
      } else if (e.animationName.includes('digit-enter')) {
        dispatch({ type: 'completed', id: digitState.id });
      }
    },
    [dispatch, digitState.id],
  );

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target !== e.currentTarget) return;
      if (digitState.phase === 'animating' && e.propertyName === 'transform') {
        dispatch({ type: 'completed', id: digitState.id });
      }
    },
    [dispatch, digitState.phase, digitState.id],
  );

  return (
    <span
      className={cn(
        'digit-reel-wrapper inline-flex items-start justify-center select-none',
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
            <span key={d} className='digit-reel-digit'>
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
