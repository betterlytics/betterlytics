'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { DigitReel } from './DigitReel';
import { AnimatedNumberProvider, useAnimatedState } from './context';
import { SignSlot } from './SignSlot';

const ZWSP = '\u200B';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  /** Enable text selection overlay */
  withTextSelect?: boolean;
  className?: string;
};

/**
 * AnimatedNumber - Smooth rolling digit animation with negative number support.
 */
function AnimatedNumberComponent({ value, duration = 800, withTextSelect = false, className }: AnimatedNumberProps) {
  return (
    <AnimatedNumberProvider value={value} duration={duration}>
      <span className={cn('inline-flex isolate whitespace-nowrap leading-none tabular-nums', className)}>
        <AnimatedNumberInner value={value} duration={duration} withTextSelect={withTextSelect} />
      </span>
    </AnimatedNumberProvider>
  );
}

/**
 * Inner component that consumes context and renders sign + digits.
 */
function AnimatedNumberInner({ value, duration, withTextSelect }: { value: number; duration: number; withTextSelect: boolean }) {
  const { state } = useAnimatedState();
  
  const activeDigitCount = state.digits.filter(d => d.phase !== 'exiting').length;

  return (
    <span 
      className={cn('animated-number-root inline-flex isolate relative ltr contain-layout')} 
    >
      {withTextSelect && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-end',
            'text-transparent select-text z-[1] leading-none font-[inherit] tabular-nums'
          )}
        >
          {Math.floor(value)}
        </span>
      )}

      {/* Sign slot - self-contained, handles its own animation */}
      <SignSlot isNegative={value < 0} />

      {/* Mask area for fade-in/out effects */}
      <span aria-hidden="true" className="number-mask">
        <span
          className="animated-number-sizer"
          style={{ '--active-digits': activeDigitCount } as React.CSSProperties}
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
