'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { DigitReel } from './DigitReel';
import { SignSlot } from './SignSlot';

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = (typeof DIGITS)[number];

export type DigitPhase = 'idle' | 'animating' | 'entering' | 'exiting';

export type DigitState = {
  id: string;
  digit: Digit;
  phase: DigitPhase;
  fromDigit: Digit | null;
};

const ZWSP = '\u200B';

type NumberRollProps = {
  value: number;
  duration?: number;
  withTextSelect?: boolean;
  className?: string;
};

function parseDigits(value: number): Digit[] {
  return String(Math.abs(Math.floor(value)))
    .split('')
    .map(Number) as Digit[];
}

function createInitialDigits(value: number): DigitState[] {
  return parseDigits(value).map((digit) => ({
    id: crypto.randomUUID(),
    digit,
    phase: 'idle' as const,
    fromDigit: null,
  }));
}

function diffDigits(prev: DigitState[], nextValues: Digit[]): DigitState[] {
  const result: DigitState[] = [];
  for (let i = 0; i < Math.max(prev.length, nextValues.length); i++) {
    const prevDigit = prev[prev.length - 1 - i];
    const nextValue = nextValues[nextValues.length - 1 - i];

    if (!prevDigit && nextValue !== undefined) {
      result.unshift({
        id: crypto.randomUUID(),
        digit: nextValue,
        phase: 'entering',
        fromDigit: 0,
      });
      continue;
    }

    if (prevDigit && nextValue === undefined) {
      result.unshift({
        ...prevDigit,
        phase: 'exiting',
      });
      continue;
    }

    if (!prevDigit || nextValue === undefined) continue;

    if (prevDigit.digit !== nextValue) {
      result.unshift({
        ...prevDigit,
        digit: nextValue,
        phase: 'animating',
        fromDigit: prevDigit.digit,
      });
    } else {
      if (prevDigit.phase === 'exiting') {
        result.unshift({
          ...prevDigit,
          phase: 'entering',
        });
      } else {
        result.unshift(prevDigit);
      }
    }
  }

  return result;
}

function NumberRollComponent({ value, duration = 800, withTextSelect = false, className }: NumberRollProps) {
  const [digits, setDigits] = useState<DigitState[]>(() => createInitialDigits(value));
  const prevValueRef = useRef(value);

  useLayoutEffect(() => {
    if (value === prevValueRef.current) return;
    setDigits((prev) => diffDigits(prev, parseDigits(value)));
    prevValueRef.current = value;
  }, [value]);

  const handlePhaseComplete = useCallback((id: string, action: 'completed' | 'exited') => {
    setDigits((prev) =>
      action === 'exited'
        ? prev.filter((d) => d.id !== id)
        : prev.map((d) => (d.id === id ? { ...d, phase: 'idle', fromDigit: null } : d)),
    );
  }, []);

  const activeDigitCount = digits.filter((d) => d.phase !== 'exiting').length;

  return (
    <span className={cn('inline-flex isolate whitespace-nowrap leading-none tabular-nums', className)}>
      <span
        className={cn('number-roll-root inline-flex isolate relative ltr contain-layout')}
        style={{ '--duration': `${duration}ms` } as React.CSSProperties}
      >
        {withTextSelect && (
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-end',
              'text-transparent select-text z-[1] leading-none font-[inherit] tabular-nums',
              'selection:text-transparent selection:bg-primary/20',
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
            style={{ '--active-digits': activeDigitCount } as React.CSSProperties}
          >
            <span className="inline-flex justify-inherit relative">
              {ZWSP}
              {digits.map((digitState) => (
                <DigitReel key={digitState.id} digitState={digitState} onPhaseComplete={handlePhaseComplete} />
              ))}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

export const NumberRoll = React.memo(NumberRollComponent);
NumberRoll.displayName = 'NumberRoll';
