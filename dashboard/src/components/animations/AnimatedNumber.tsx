'use client';

import { DIGIT_WIDTH, ZWSP, SPRING_EASING, getMaskStyles } from '@/constants/animated-number';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
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
function AnimatedNumberComponent({ value, duration = 1200, withTextSelect = false, className }: AnimatedNumberProps) {
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
  const maskStyles = useMemo(() => getMaskStyles(), []);
  
  const activeDigitCount = state.digits.filter(d => d.phase !== 'exiting').length;
  const displayValue = Math.abs(Math.floor(value));

  return (
    <span className={cn('inline-flex isolate relative ltr contain-layout')}>
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
      <span aria-hidden="true" style={maskStyles}>
        <span
          className="inline-flex justify-end"
          style={{
            width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
            transition: `width ${duration}ms ${SPRING_EASING}`,
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
