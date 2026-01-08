'use client';

import { type Digit } from '@/constants/animated-number';
import React from 'react';
import { DigitReelV2 } from './DigitReelV2';

type AnimatedNumberV2Props = {
  value: number;
};

/**
 * V2: Bare minimum animated number container.
 * Just splits the number into digits and renders them.
 * No animation logic, no lifecycle management, no mask.
 */
function AnimatedNumberV2Component({ value }: AnimatedNumberV2Props) {
  const digits = String(Math.abs(Math.floor(value)))
    .split('')
    .map(Number) as Digit[];

  const isNegative = value < 0;

  return (
    <span className="inline-flex items-center">
      {isNegative && <span>−</span>}
      {digits.map((digit, index) => (
        <DigitReelV2 key={index} digit={digit} />
      ))}
    </span>
  );
}

export const AnimatedNumberV2 = React.memo(AnimatedNumberV2Component);
AnimatedNumberV2.displayName = 'AnimatedNumberV2';
