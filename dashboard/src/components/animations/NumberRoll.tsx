'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { NumberRollProvider, useAnimatedConfig, useAnimatedState } from './context';
import { DigitReel } from './DigitReel';
import { SignSlot } from './SignSlot';

const ZWSP = '\u200B';

type NumberRollProps = {
  value: number;
  duration?: number;
  /** Enable text selection overlay */
  withTextSelect?: boolean;
  className?: string;
};

/**
 * NumberRoll - Smooth rolling digit animation with negative number support.
 */
function NumberRollComponent({ value, duration = 800, withTextSelect = false, className }: NumberRollProps) {
  return (
    <NumberRollProvider value={value} duration={duration}>
      <span className={cn('inline-flex isolate whitespace-nowrap leading-none tabular-nums', className)}>
        <NumberRollInner value={value} withTextSelect={withTextSelect} />
      </span>
    </NumberRollProvider>
  );
}

/**
 * Inner component that consumes context and renders sign + digits.
 */
function NumberRollInner({ value, withTextSelect }: { value: number; withTextSelect: boolean }) {
  const { state } = useAnimatedState();
  const { duration } = useAnimatedConfig();

  return (
    <span 
      className={cn('number-roll-root inline-flex isolate relative ltr contain-layout')}
      style={{ '--duration': `${duration}ms` } as React.CSSProperties}
    >
      {withTextSelect && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-end',
            'text-transparent select-text z-[1] leading-none font-[inherit] tabular-nums',
            'selection:text-transparent selection:bg-primary/20'
          )}
          style={{ letterSpacing: 'calc(var(--digit-width) - 1ch)' } as React.CSSProperties}
        >
          {Math.floor(value).toString().replace('-', '−')}
        </span>
      )}

      <SignSlot isNegative={value < 0} />

      <span aria-hidden="true" className="number-mask">
        <span
          className="number-roll-sizer"
          style={{ '--active-digits': state.digits.filter(d => d.phase !== 'exiting').length } as React.CSSProperties}
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

export const NumberRoll = React.memo(NumberRollComponent);
NumberRoll.displayName = 'NumberRoll';
