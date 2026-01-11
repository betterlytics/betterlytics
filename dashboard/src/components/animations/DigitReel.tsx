'use client';

import { DIGIT_WIDTH, DIGITS, MASK_HEIGHT, SPRING_EASING, getDigitMaskStyles } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { useAnimatedNumber } from './context';
import { useLayoutTransitionSuppression } from '@/hooks/useLayoutTransitionSuppression';
import type { DigitState, DigitPhase } from './types';

type DigitReelProps = {
  digitState: DigitState;
};

/**
 * Calculate transform offset based on phase.
 */
function getTransformConfig(
  phase: DigitPhase,
  digit: number,
  fromDigit: number | null,
  isSuppressing: boolean
): { offset: number; animate: boolean } {
  switch (phase) {
    case 'entering':
      return isSuppressing
        ? { offset: -(fromDigit ?? 0) * 10, animate: false }
        : { offset: -digit * 10, animate: true };
    case 'exiting':
      // When suppressing: stay at current position, no transition (width gets head start)
      // When not suppressing: roll to 0 with transition
      return isSuppressing
        ? { offset: -(fromDigit ?? digit) * 10, animate: false }
        : { offset: 0, animate: true };
    case 'animating':
      return { offset: -digit * 10, animate: true };
    default: // idle
      return { offset: -digit * 10, animate: false };
  }
}

/**
 * Single digit reel - pure render with phase-driven animation.
 */
function DigitReelComponent({ digitState }: DigitReelProps) {
  const { dispatch, duration } = useAnimatedNumber();
  const { id, digit, phase, fromDigit } = digitState;
  
  const digitMaskStyles = useMemo(() => getDigitMaskStyles(), []);
  
  // Suppress transition for first frame when entering or exiting
  // This gives width transition a head start to position/hide the digit
  const isSuppressing = useLayoutTransitionSuppression(phase === 'entering' || phase === 'exiting');
  
  const { offset, animate } = getTransformConfig(phase, digit, fromDigit, isSuppressing);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'transform' || e.target !== e.currentTarget) return;
    
    if (phase === 'animating' || phase === 'entering') {
      dispatch({ type: 'completed', id });
    }
    // Exiting digits stay in DOM but hidden by fade zone
    // They'll be cleaned up on next value change
  };

  const isHidden = (phase === 'entering' && isSuppressing) || (phase === 'exiting' && !isSuppressing);

  return (
    <span
      className={cn('inline-flex justify-center items-start select-none', `w-[${DIGIT_WIDTH}]`)}
      style={digitMaskStyles}
    >
      <span
        className={cn(
          'inline-flex flex-col justify-center items-center will-change-[transform,opacity]',
          `w-[${DIGIT_WIDTH}]`,
          isHidden ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          transform: `translate3d(0, ${offset}%, 0)`,
          transition: animate 
            ? `transform ${duration}ms ${SPRING_EASING}, opacity ${duration}ms ${SPRING_EASING}` 
            : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {DIGITS.map((d) => (
          <span key={d} className={cn('inline-block', `py-[calc(${MASK_HEIGHT}/2)]`)}>{d}</span>
        ))}
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
