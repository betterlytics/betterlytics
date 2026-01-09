'use client';

import { DIGIT_WIDTH, MASK_HEIGHT, ZWSP, getMaskStyles, type Digit } from '@/constants/animated-number';
import React, { useMemo } from 'react';
import { DigitReelV2 } from './DigitReelV2';

type AnimatedNumberV2Props = {
  value: number;
};

/**
 * AnimatedNumberV2 - DOM structure only (no animations yet)
 * 
 * Structure:
 * - Container (inline-flex, in DOM flow)
 *   - Pre section (width 0, for accessibility spacing)
 *   - Mask (overflow:hidden, gradient edges)
 *     - Integer section (width = N * DIGIT_WIDTH)
 *       - Wrapper (contains ZWSP + all digit reels)
 *         - Sentinel reel (for enter animation, initially at 0)
 *         - Digit reels...
 *   - Post section (width 0)
 */
function AnimatedNumberV2Component({ value }: AnimatedNumberV2Props) {
  const digits = String(Math.abs(Math.floor(value)))
    .split('')
    .map(Number) as Digit[];

  const isNegative = value < 0;
  const maskStyles = useMemo(() => getMaskStyles(), []);

  const digitCount = digits.length;
  const integerSectionWidth = `calc(${digitCount} * ${DIGIT_WIDTH})`;

  return (
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
              // transform will be applied here for horizontal enter/exit animation
            }}
          >
            {/* Wrapper containing ZWSP + digit reels */}
            <span data-element="digit-wrapper" style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
              {ZWSP}
              
              {/* Sentinel reel (hidden, for enter animation) */}
              {/* Will be added in Step 3 */}
              
              {/* Digit reels */}
              {digits.map((digit, index) => (
                <DigitReelV2 key={index} digit={digit} />
              ))}
            </span>
          </span>

          {/* Fraction section (for decimals, currently unused) */}
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
  );
}

export const AnimatedNumberV2 = React.memo(AnimatedNumberV2Component);
AnimatedNumberV2.displayName = 'AnimatedNumberV2';
