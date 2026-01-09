'use client';

import { DIGIT_WIDTH, MASK_HEIGHT, ZWSP, getMaskStyles, type Digit } from '@/constants/animated-number';
import React, { useMemo, useReducer, useEffect, useRef } from 'react';
import { DigitReelV2 } from './DigitReelV2';
import { AnimatedNumberContext } from './context';
import { animatedNumberReducer, createInitialDigits } from './reducer';
import type { AnimatedNumberState } from './types';

type AnimatedNumberV2Props = {
  value: number;
  duration?: number;
};

/**
 * AnimatedNumberV2 - With state machine for rolling animation
 */
function AnimatedNumberV2Component({ value, duration = 4000 }: AnimatedNumberV2Props) {
  // Initialize state with current value
  const [state, dispatch] = useReducer(
    animatedNumberReducer,
    value,
    (initialValue) => ({ digits: createInitialDigits(initialValue) })
  );

  const prevValueRef = useRef(value);

  // Handle value changes
  useEffect(() => {
    if (value !== prevValueRef.current) {
      const newDigitValues = String(Math.abs(Math.floor(value)))
        .split('')
        .map(Number) as Digit[];

      const prevDigitCount = state.digits.length;
      const newDigitCount = newDigitValues.length;

      if (newDigitCount !== prevDigitCount) {
        // Digit count changed - need to sync state
        // Map from RIGHT (least significant) - so existing digits stay in place
        const newDigits: typeof state.digits = [];
        
        for (let i = 0; i < newDigitCount; i++) {
          const digit = newDigitValues[i];
          // Align from right: new index i maps to old index (i - (newDigitCount - prevDigitCount))
          const oldIndex = i - (newDigitCount - prevDigitCount);
          const existing = oldIndex >= 0 ? state.digits[oldIndex] : null;
          
          if (existing) {
            // Preserve existing digit, update value if different
            if (existing.digit !== digit) {
              newDigits.push({ ...existing, digit, phase: 'animating' as const, fromDigit: existing.digit });
            } else {
              newDigits.push(existing);
            }
          } else {
            // New digit position (leftmost) - just appear for now (Step 3b adds animation)
            newDigits.push({
              id: crypto.randomUUID(),
              digit,
              phase: 'idle' as const,
              fromDigit: null,
            });
          }
        }
        dispatch({ type: 'sync', digits: newDigits });
      } else {
        // Same digit count - just dispatch changes
        newDigitValues.forEach((newDigit, index) => {
          const prevState = state.digits[index];
          if (prevState && prevState.digit !== newDigit) {
            dispatch({
              type: 'changed',
              id: prevState.id,
              fromDigit: prevState.digit,
              toDigit: newDigit,
            });
          }
        });
      }

      prevValueRef.current = value;
    }
  }, [value, state.digits]);

  const isNegative = value < 0;
  const maskStyles = useMemo(() => getMaskStyles(), []);

  const digitCount = state.digits.length;
  const integerSectionWidth = `calc(${digitCount} * ${DIGIT_WIDTH})`;

  return (
    <AnimatedNumberContext.Provider value={{ state, dispatch, duration }}>
      <span
        style={{
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-flex',
          isolation: 'isolate',
          whiteSpace: 'nowrap',
        }}
      >
        {isNegative && <span>−</span>}
        
        <span
          aria-label={value.toString()}
          data-element="container"
          style={{
            display: 'inline-flex',
            direction: 'ltr',
            isolation: 'isolate',
            position: 'relative',
            zIndex: -1,
          }}
        >
          {/* Pre section */}
          <span
            aria-hidden="true"
            data-element="pre-section"
            className="number-section-pre"
            style={{
              padding: `calc(${MASK_HEIGHT}/2) 0`,
              display: 'inline-flex',
              justifyContent: 'flex-end',
              width: 0,
            }}
          >
            <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
              {ZWSP}
            </span>
          </span>

          {/* Mask */}
          <span aria-hidden="true" data-element="mask" style={maskStyles}>
            {/* Integer section */}
            <span
              data-element="integer-section"
              className="number-section-integer"
              style={{
                display: 'inline-flex',
                justifyContent: 'flex-end',
                width: integerSectionWidth,
              }}
            >
              {/* Wrapper containing digit reels */}
              <span data-element="digit-wrapper" style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
                {ZWSP}
                
                {/* Digit reels from state */}
                {state.digits.map((digitState) => (
                  <DigitReelV2 key={digitState.id} digitState={digitState} />
                ))}
              </span>
            </span>

            {/* Fraction section */}
            <span
              data-element="fraction-section"
              className="number-section-fraction"
              style={{
                display: 'inline-flex',
                justifyContent: 'flex-start',
                width: 0,
              }}
            >
              <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
                {ZWSP}
              </span>
            </span>
          </span>

          {/* Post section */}
          <span
            aria-hidden="true"
            data-element="post-section"
            className="number-section-post"
            style={{
              padding: `calc(${MASK_HEIGHT}/2) 0`,
              display: 'inline-flex',
              justifyContent: 'flex-start',
              width: 0,
            }}
          >
            <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
              {ZWSP}
            </span>
          </span>
        </span>
      </span>
    </AnimatedNumberContext.Provider>
  );
}

export const AnimatedNumberV2 = React.memo(AnimatedNumberV2Component);
AnimatedNumberV2.displayName = 'AnimatedNumberV2';
