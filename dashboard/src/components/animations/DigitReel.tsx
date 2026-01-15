'use client';

import { cn } from '@/lib/utils';
import React, { useMemo, useCallback } from 'react';
import { DIGITS, useAnimatedConfig, type DigitState } from './context';

type DigitReelProps = {
  digitState: DigitState;
};

/**
 * Hook to handle all animation/transition logic and node styles.
 */
function useDigitVisuals(
  digitState: DigitState,
  duration: number,
  dispatch: React.Dispatch<any>
) {
  const { id, digit, phase } = digitState;

  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return; // Ignore bubbles

    if (e.animationName.includes('digit-exit')) {
      dispatch({ type: 'exited', id });
    } else if (e.animationName.includes('digit-enter')) {
      dispatch({ type: 'completed', id });
    }
  }, [dispatch, id]);

  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
     if (e.target !== e.currentTarget) return;
     if (phase === 'animating' && e.propertyName === 'transform') {
       dispatch({ type: 'completed', id });
     }
  }, [dispatch, phase, id]);

  const wrapperStyle = useMemo(() => {
    return {
      '--duration': `${duration}ms`,
      width: 'var(--digit-width)',
      overflow: 'visible',
    } as React.CSSProperties;
  }, [duration]);

  const reelStyle = useMemo(() => ({
    '--target-offset': `${-digit * 10}%`,
  } as React.CSSProperties), [digit]);

  return {
    wrapperStyle,
    reelStyle,
    handleAnimationEnd,
    handleTransitionEnd
  };
}

function DigitReelComponent({ digitState }: DigitReelProps) {
  const { dispatch, duration } = useAnimatedConfig();
  const { wrapperStyle, reelStyle, handleAnimationEnd, handleTransitionEnd } = useDigitVisuals(digitState, duration, dispatch);

  return (
    <span
      className={cn(
        'digit-reel-wrapper inline-flex justify-center items-start select-none',
        'motion-reduce:[--reduced-duration:0ms]'
      )}
      style={wrapperStyle}
      data-phase={digitState.phase}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleTransitionEnd}
    >
      <span
        className={cn('inline-flex justify-center items-start digit-reel-mask')}
      >
        <span
          className={cn(
            'digit-reel-inner inline-flex flex-col justify-center items-center',
            `w-[var(--digit-width)]`
          )}
          style={reelStyle}
          data-phase={digitState.phase}
        >
          {DIGITS.map((d) => (
            <span key={d} className="digit-reel-digit">{d}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
