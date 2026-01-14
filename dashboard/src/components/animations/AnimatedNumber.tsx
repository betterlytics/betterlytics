'use client';

import { DIGIT_WIDTH, ZWSP, SPRING_EASING, LAYOUT_EASING, MASK_WIDTH } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React from 'react';
import { DigitReel } from './DigitReel';
import { AnimatedNumberProvider, useAnimatedNumber } from './context';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  /** Enable text selection overlay */
  withTextSelect?: boolean;
  className?: string;
};

/**
 * AnimatedNumber - Smooth rolling digit animation.
 */
function AnimatedNumberComponent({ value, duration = 800, withTextSelect = false, className }: AnimatedNumberProps) {
  return (
    <AnimatedNumberProvider value={value} duration={duration}>
      <span className={cn('inline-flex isolate whitespace-nowrap leading-none tabular-nums', className)}>
        {value < 0 && <span>−</span>}
        <AnimatedNumberInner value={value} duration={duration} withTextSelect={withTextSelect} />
      </span>
    </AnimatedNumberProvider>
  );
}

/**
 * Inner component that consumes context and renders digits.
 */
function AnimatedNumberInner({ value, duration, withTextSelect }: { value: number; duration: number; withTextSelect: boolean }) {
  const { state } = useAnimatedNumber();
  
  const activeDigitCount = state.digits.filter(d => d.phase !== 'exiting').length;
  const displayValue = Math.abs(Math.floor(value));

  return (
    <span className={cn('inline-flex isolate relative ltr contain-layout')} style={{ '--mask-width': MASK_WIDTH } as React.CSSProperties}>
      {withTextSelect && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-end',
            'text-transparent select-text z-[1] leading-none font-[inherit] tabular-nums'
          )}
        >
          {displayValue}
        </span>
      )}

      {/* Mask area for fade-in/out effects */}
      <span aria-hidden="true" className="number-mask">
        <span
          className="inline-flex justify-end"
          style={{
            width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
            transition: `width ${duration/4}ms ${LAYOUT_EASING}`,
          }}
        >
          <span className="inline-flex justify-inherit relative">
            {ZWSP}
            {state.digits.map((digitState) => (
              <DigitReel key={digitState.id} digitState={digitState} />
            ))}
          </span>
        </span>
      </span>
    </span>
  );
}

export const AnimatedNumber = React.memo(AnimatedNumberComponent);
AnimatedNumber.displayName = 'AnimatedNumber';
