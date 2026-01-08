'use client';

import React, { useReducer, useEffect, useRef } from 'react';
import { AnimatedNumberContext } from './context';
import { DigitReelV2 } from './DigitReelV2';
import { animatedNumberReducer, createInitialDigits, computeDigitChanges } from './reducer';
import type { AnimatedNumberState } from './types';

type AnimatedNumberV2Props = {
  value: number;
  duration?: number;
};

function AnimatedNumberV2Component({ value, duration = 600 }: AnimatedNumberV2Props) {
  const initialState: AnimatedNumberState = {
    digits: createInitialDigits(value),
  };

  const [state, dispatch] = useReducer(animatedNumberReducer, initialState);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      const { newDigits } = computeDigitChanges(state.digits, value);
      
      // Dispatch changes for each digit that needs to animate
      newDigits.forEach((newDigit, index) => {
        const prevDigit = state.digits[index];
        if (prevDigit && prevDigit.digit !== newDigit.digit) {
          dispatch({
            type: 'changed',
            id: prevDigit.id,
            fromDigit: prevDigit.digit,
            toDigit: newDigit.digit,
          });
        }
      });

      prevValueRef.current = value;
    }
  }, [value, state.digits]);

  const isNegative = value < 0;

  return (
    <AnimatedNumberContext.Provider value={{ state, dispatch, duration }}>
      <span className="inline-flex items-center">
        {isNegative && <span>−</span>}
        {state.digits.map((digitState) => (
          <DigitReelV2 key={digitState.id} digitState={digitState} />
        ))}
      </span>
    </AnimatedNumberContext.Provider>
  );
}

export const AnimatedNumberV2 = React.memo(AnimatedNumberV2Component);
AnimatedNumberV2.displayName = 'AnimatedNumberV2';
