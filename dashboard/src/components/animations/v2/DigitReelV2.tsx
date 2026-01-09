'use client';

import { DIGIT_WIDTH, DIGITS, MASK_HEIGHT, getDigitMaskStyles, type Digit } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';

type DigitReelV2Props = {
  digit: Digit;
};

const PADDING_CLASS = `py-[calc(${MASK_HEIGHT}/2)]` as const;

/**
 * Single digit reel - renders all 10 digits stacked.
 * Current digit is in flow, others are absolute positioned above/below.
 */
function DigitReelV2Component({ digit }: DigitReelV2Props) {
  const digitMaskStyles = useMemo(() => getDigitMaskStyles(), []);

  return (
    <span
      data-element="digit-container"
      data-digit={digit}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        width: DIGIT_WIDTH,
        ...digitMaskStyles,
      }}
    >
      <span
        data-element="digit-reel"
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          width: DIGIT_WIDTH,
          // transform will be applied for animation
        }}
      >
        {/* Digits above current (absolute, bottom: 100%) */}
        <span
          data-element="digits-above"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            width: '100%',
            bottom: '100%',
            left: 0,
          }}
        >
          {DIGITS.slice(0, digit).map((d) => (
            <span key={d} className={cn("inline-block", PADDING_CLASS)}>{d}</span>
          ))}
        </span>

        {/* Current digit (in flow) */}
        <span className={cn("inline-block", PADDING_CLASS)}>{digit}</span>

        {/* Digits below current (absolute, top: 100%) */}
        <span
          data-element="digits-below"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            width: '100%',
            top: '100%',
            left: 0,
          }}
        >
          {DIGITS.slice(digit + 1).map((d) => (
            <span key={d} className={cn("inline-block", PADDING_CLASS)}>{d}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

export const DigitReelV2 = React.memo(DigitReelV2Component);
DigitReelV2.displayName = 'DigitReelV2';
