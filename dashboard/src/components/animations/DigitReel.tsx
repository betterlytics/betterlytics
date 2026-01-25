'use client';

import React, { useCallback } from 'react';
import { DIGITS, type DigitState } from './NumberRoll';

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

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
      className='digit-reel-wrapper'
      data-phase={digitState.phase}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleTransitionEnd}
    >
      <span className='digit-reel-mask'>
        <span
          className='digit-reel-inner'
          style={{ '--target-offset': `${-digitState.digit * 10}%` } as React.CSSProperties}
          data-phase={digitState.phase}
        >
          {DIGITS.map((d) => (
            <span key={d} className={cn('digit-reel-digit', d !== digitState.digit && 'inactive')}>
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
