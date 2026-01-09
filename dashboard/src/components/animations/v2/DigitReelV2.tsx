'use client';

import { DIGIT_WIDTH, DIGITS, MASK_HEIGHT, SPRING_EASING, getDigitMaskStyles } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { useAnimatedNumber } from './context';
import { useLayoutTransitionSuppression } from '@/hooks/useLayoutTransitionSuppression';
import type { DigitState, DigitPhase } from './types';

type DigitReelV2Props = {
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
      return { offset: 0, animate: true };
    case 'animating':
      return { offset: -digit * 10, animate: true };
    default: // idle
      return { offset: -digit * 10, animate: false };
  }
}

/**
 * Single digit reel - pure render with phase-driven animation.
 */
function DigitReelV2Component({ digitState }: DigitReelV2Props) {
  const { dispatch, duration } = useAnimatedNumber();
  const { id, digit, phase, fromDigit } = digitState;
  
  const digitMaskStyles = useMemo(() => getDigitMaskStyles(), []);
  
  // Suppress transition when component mounts in 'entering' phase
  // The hook handles the "just changed" detection internally
  const isSuppressing = useLayoutTransitionSuppression(phase === 'entering');
  
  const { offset, animate } = getTransformConfig(phase, digit, fromDigit, isSuppressing);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'transform' || e.target !== e.currentTarget) return;
    
    if (phase === 'animating' || phase === 'entering') {
      dispatch({ type: 'completed', id });
    } else if (phase === 'exiting') {
      dispatch({ type: 'exited', id });
    }
  };

  return (
    <span
      data-element="digit-container"
      data-digit={digit}
      data-phase={phase}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: DIGIT_WIDTH,
        ...digitMaskStyles,
      }}
    >
      <span
        data-element="digit-reel"
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          width: DIGIT_WIDTH,
          transform: `translateY(${offset}%)`,
          transition: animate ? `transform ${duration}ms ${SPRING_EASING}` : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {DIGITS.map((d) => (
          <span key={d} className={cn("inline-block", `py-[calc(${MASK_HEIGHT}/2)]`)}>{d}</span>
        ))}
      </span>
    </span>
  );
}

export const DigitReelV2 = React.memo(DigitReelV2Component);
DigitReelV2.displayName = 'DigitReelV2';
