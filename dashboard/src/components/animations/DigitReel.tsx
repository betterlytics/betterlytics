'use client';

import { DIGIT_WIDTH, DIGITS, MASK_BLEED, SPRING_EASING, LAYOUT_EASING, OPACITY_EASING } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { useAnimatedNumber, type DigitState } from './context';

type DigitReelProps = {
  digitState: DigitState;
};

// Helper to get base offset
function getBaseOffset(digit: number) {
  return -digit * 10;
}

/**
 * Hook to handle all animation/transition logic and node styles.
 */
function useDigitVisuals(
  digitState: DigitState, 
  duration: number, 
  dispatch: React.Dispatch<any>
) {
  const { id, digit, phase } = digitState;

  // Event Handlers
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return; // Ignore bubbles

    if (e.animationName.includes('digit-exit')) {
      dispatch({ type: 'exited', id });
    } else if (e.animationName.includes('digit-enter')) {
      dispatch({ type: 'completed', id });
    }
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
     if (e.target !== e.currentTarget) return;
     if (phase === 'animating' && e.propertyName === 'transform') {
       dispatch({ type: 'completed', id });
     }
  };

  // 1. Wrapper Style (Layout + Flyout)
  const wrapperStyle = useMemo(() => {
    let animation = 'none';
    if (phase === 'entering') {
      // Split opacity (slow linear/ease-in) from layout (fast bounce)
      animation = `digit-enter ${duration}ms ${LAYOUT_EASING} forwards, fade-in ${duration}ms ${OPACITY_EASING} forwards`;
    } else if (phase === 'exiting') {
      animation = `digit-exit ${duration}ms ${LAYOUT_EASING} forwards`;
    }

    return {
      '--digit-width': DIGIT_WIDTH,
      '--mask-bleed': MASK_BLEED,
      animation,
      width: DIGIT_WIDTH,
      overflow: 'visible',
    } as React.CSSProperties;
  }, [phase, duration]);

  // 2. Reel Style (Vertical Motion)
  const reelStyle = useMemo(() => {
    const offset = getBaseOffset(digit);
    
    if (phase === 'entering') {
      return {
        transform: `translate3d(0, ${offset}%, 0)`,
        '--target-offset': `${offset}%`,
        animation: `digit-roll-in ${duration}ms ${SPRING_EASING} forwards`,
      } as React.CSSProperties;
    } 
    
    if (phase === 'exiting') {
      return {
        transform: `translate3d(0, ${offset}%, 0)`,
        '--target-offset': `${-digit * 10}%`,
        animation: `digit-roll-out ${duration}ms ${SPRING_EASING} forwards`,
      } as React.CSSProperties;
    } 
    
    // Animating / Idle
    return {
      transform: `translate3d(0, ${offset}%, 0)`,
      transition: phase === 'animating' 
        ? `transform var(--motion-transform-duration, ${duration}ms) ${SPRING_EASING}`
        : 'none',
    };
  }, [phase, digit, duration]);

  return {
    wrapperStyle,
    reelStyle,
    handleAnimationEnd,
    handleTransitionEnd
  };
}

function DigitReelComponent({ digitState }: DigitReelProps) {
  const { dispatch, duration } = useAnimatedNumber();
  const { wrapperStyle, reelStyle, handleAnimationEnd, handleTransitionEnd } = useDigitVisuals(digitState, duration, dispatch);

  return (
    <span
      className={cn('inline-flex justify-center items-start select-none')}
      style={wrapperStyle}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleTransitionEnd}
    >
      <span
        className={cn('inline-flex justify-center items-start digit-reel-mask')}
      >
        <span
          className={cn(
            'inline-flex flex-col justify-center items-center',
            `w-[${DIGIT_WIDTH}]`,
            'motion-reduce:[--motion-transform-duration:0ms]'
          )}
          style={reelStyle}
        >
          {DIGITS.map((d) => (
            <span key={d} className={cn('inline-block', `py-[calc(${MASK_BLEED}/2)]`)}>{d}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
