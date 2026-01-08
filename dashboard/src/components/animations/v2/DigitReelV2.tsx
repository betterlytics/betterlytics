'use client';

import { DIGIT_WIDTH } from '@/constants/animated-number';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { useAnimatedNumber } from './context';
import type { DigitState } from './types';

type DigitReelV2Props = {
  digitState: DigitState;
};

function DigitReelV2Component({ digitState }: DigitReelV2Props) {
  const { dispatch, duration } = useAnimatedNumber();
  const { id, digit, phase, fromDigit } = digitState;
  
  // Two-phase render: snap to offset, then animate
  const [isSnapping, setIsSnapping] = useState(phase === 'animating');
  const prevPhaseRef = useRef(phase);

  useLayoutEffect(() => {
    if (phase === 'animating' && prevPhaseRef.current !== 'animating') {
      // Just entered animating phase - snap first
      setIsSnapping(true);
      const rafId = requestAnimationFrame(() => {
        setIsSnapping(false);
      });
      return () => cancelAnimationFrame(rafId);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === 'transform' && e.target === e.currentTarget) {
      dispatch({ type: 'completed', id });
    }
  };

  // Calculate transform
  const offset = phase === 'animating' && fromDigit !== null
    ? (digit - fromDigit) * 100
    : 0;

  const shouldSnap = phase === 'animating' && isSnapping;

  return (
    <span
      style={{
        width: DIGIT_WIDTH,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: shouldSnap ? `translateY(${offset}%)` : 'translateY(0%)',
        transition: shouldSnap ? 'none' : `transform ${duration}ms ease-out`,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {digit}
    </span>
  );
}

export const DigitReelV2 = React.memo(DigitReelV2Component);
DigitReelV2.displayName = 'DigitReelV2';
