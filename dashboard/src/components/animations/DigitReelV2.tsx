'use client';

import { DIGIT_WIDTH, type Digit } from '@/constants/animated-number';
import React from 'react';

type DigitReelV2Props = {
  digit: Digit;
};

/**
 * V2: Bare minimum digit display.
 * No animations, no state, no effects.
 * Just renders the digit statically.
 */
function DigitReelV2Component({ digit }: DigitReelV2Props) {
  return (
    <span
      style={{ width: DIGIT_WIDTH }}
      className="inline-flex justify-center items-center"
    >
      {digit}
    </span>
  );
}

export const DigitReelV2 = React.memo(DigitReelV2Component);
DigitReelV2.displayName = 'DigitReelV2';
