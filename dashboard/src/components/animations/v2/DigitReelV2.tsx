'use client';

import { DIGIT_WIDTH, DIGITS, MASK_HEIGHT, SPRING_EASING, getDigitMaskStyles } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { useAnimatedNumber } from './context';
import type { DigitState } from './types';

type DigitReelV2Props = {
  digitState: DigitState;
};

/**
 * Single digit reel with rolling animation.
 * All 10 digits stacked, transform positions the target digit in view.
 * CSS transition handles smooth animation and interrupts.
 */
function DigitReelV2Component({ digitState }: DigitReelV2Props) {
  const { dispatch, duration } = useAnimatedNumber();
  const { id, digit, phase } = digitState;
  
  const digitMaskStyles = useMemo(() => getDigitMaskStyles(), []);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === 'transform' && e.target === e.currentTarget) {
      if (phase === 'animating') {
        dispatch({ type: 'completed', id });
      }
    }
  };

  const isAnimating = phase === 'animating';
  
  // Each digit is 1/10th of the reel height
  // digit 0 = 0%, digit 5 = -50%, digit 9 = -90%
  const targetOffset = -digit * 10;

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
          transform: `translateY(${targetOffset}%)`,
          // Always have transition active - CSS handles interrupts smoothly
          transition: `transform ${duration}ms ${SPRING_EASING}`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* All 10 digits stacked 0-9 */}
        {DIGITS.map((d) => (
          <span key={d} className={cn("inline-block", `py-[calc(${MASK_HEIGHT}/2)]`)}>{d}</span>
        ))}
      </span>
    </span>
  );
}

export const DigitReelV2 = React.memo(DigitReelV2Component);
DigitReelV2.displayName = 'DigitReelV2';
