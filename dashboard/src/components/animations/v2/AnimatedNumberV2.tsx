'use client';

import { DIGIT_WIDTH, MASK_HEIGHT, ZWSP, SPRING_EASING, getMaskStyles } from '@/constants/animated-number';
import React, { useMemo } from 'react';
import { DigitReelV2 } from './DigitReelV2';
import { AnimatedNumberProvider, useAnimatedNumber } from './context';

type AnimatedNumberV2Props = {
  value: number;
  duration?: number;
};

/**
 * AnimatedNumberV2 - Smooth rolling digit animation.
 */
function AnimatedNumberV2Component({ value, duration = 1200 }: AnimatedNumberV2Props) {
  const isNegative = value < 0;

  return (
    <AnimatedNumberProvider value={value} duration={duration}>
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
        <AnimatedNumberInner value={value} duration={duration} />
      </span>
    </AnimatedNumberProvider>
  );
}

/**
 * Inner component that consumes context and renders digits.
 */
function AnimatedNumberInner({ value, duration }: { value: number; duration: number }) {
  const { state } = useAnimatedNumber();
  const maskStyles = useMemo(() => getMaskStyles(), []);

  return (
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
            width: `calc(${state.digits.length} * ${DIGIT_WIDTH})`,
            transition: `width ${duration}ms ${SPRING_EASING}`,
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
  );
}

export const AnimatedNumberV2 = React.memo(AnimatedNumberV2Component);
AnimatedNumberV2.displayName = 'AnimatedNumberV2';
