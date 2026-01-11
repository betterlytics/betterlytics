'use client';

import { DIGIT_WIDTH, DIGITS, MASK_HEIGHT, SPRING_EASING, getDigitMaskStyles } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { useAnimatedNumber, type DigitState, type DigitPhase } from './context';
import { useLayoutTransitionSuppression } from '@/hooks/useLayoutTransitionSuppression';

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
 * Respects prefers-reduced-motion: rolling is disabled, fade remains.
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
    if (e.target !== e.currentTarget || (e.propertyName !== 'transform' && e.propertyName !== 'opacity')) return;
    
    if (phase === 'animating' || phase === 'entering') {
      dispatch({ type: 'completed', id });
    }
    // Exiting digits cleaned on next value change
  };

  const isHidden = (phase === 'entering' && isSuppressing) || (phase === 'exiting' && !isSuppressing);

  const transitionStyle = animate
    ? `transform var(--motion-transform-duration, ${duration}ms) ${SPRING_EASING}, opacity ${duration}ms ${SPRING_EASING}`
    : 'none';

  return (
    <span
      className={cn('inline-flex justify-center items-start select-none', `w-[${DIGIT_WIDTH}]`)}
      style={digitMaskStyles}
    >
      <span
        className={cn(
          'inline-flex flex-col justify-center items-center',
          `w-[${DIGIT_WIDTH}]`,
          isHidden ? 'opacity-0' : 'opacity-100',
          'motion-reduce:[--motion-transform-duration:0ms]' // Keep enter/exit fade
        )}
        style={{
          transform: `translate3d(0, ${offset}%, 0)`,
          transition: transitionStyle,
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
