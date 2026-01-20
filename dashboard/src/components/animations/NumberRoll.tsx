'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DigitReel } from './DigitReel';
import { SymbolSlot } from './SymbolSlot';
import { Token, TokenPhase, diffTokens, createInitialTokens } from './tokens';

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
  locales?: Intl.LocalesArgument;
  formatOptions?: Intl.NumberFormatOptions;
  duration?: number;
  withTextSelect?: boolean;
  className?: string;
};

type State = {
  tokens: Token[];
  parts: Intl.NumberFormatPart[];
};

function NumberRollComponent({
  value,
  locales,
  formatOptions,
  duration = 800,
  withTextSelect = false,
  className,
}: NumberRollProps) {
  // Memoize the formatter - only recreate when locales/formatOptions change
  // Use 'en-US' as default to prevent hydration mismatch
  const resolvedLocales = locales ?? 'en-US';
  const formatterRef = useRef<Intl.NumberFormat | null>(null);
  const prevOptsRef = useRef({ locales: resolvedLocales, formatOptions });
  
  if (
    !formatterRef.current ||
    resolvedLocales !== prevOptsRef.current.locales ||
    formatOptions !== prevOptsRef.current.formatOptions
  ) {
    formatterRef.current = new Intl.NumberFormat(resolvedLocales, formatOptions);
    prevOptsRef.current = { locales: resolvedLocales, formatOptions };
  }
  
  const formatter = formatterRef.current;
  
  // Get parts from formatter
  const rawParts = useMemo(() => formatter.formatToParts(value), [formatter, value]);
  
  // State: tokens for rendering + parts for next diff
  const [state, setState] = useState<State>(() => ({
    tokens: createInitialTokens(rawParts),
    parts: rawParts,
  }));
  const prevValueRef = useRef(value);
  const prevRawPartsRef = useRef(rawParts);
  
  // Diff when value OR parts change (parts change = locale/format change)
  useLayoutEffect(() => {
    if (rawParts === prevRawPartsRef.current) return;
    
    setState((prev: State) => ({
      tokens: diffTokens(prev.tokens, prev.parts, rawParts),
      parts: rawParts,
    }));
    
    prevValueRef.current = value;
    prevRawPartsRef.current = rawParts;
  }, [value, rawParts]);
  
  // Handle phase completion
  const handlePhaseComplete = useCallback((id: string, action: 'completed' | 'exited' | 'entered') => {
    setState((prev: State) => ({
      ...prev,
      tokens: action === 'exited'
        ? prev.tokens.filter((t: Token) => t.id !== id)
        : prev.tokens.map((t: Token) => t.id === id ? { ...t, phase: 'idle' as TokenPhase, fromValue: undefined } : t),
    }));
  }, []);
  
  // Formatted string for text selection and ghost measurement
  const formattedString = useMemo(() => formatter.format(value), [formatter, value]);

  // Ghost measurement for accurate container width
  const ghostRef = useRef<HTMLSpanElement>(null);
  const [targetWidth, setTargetWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (ghostRef.current) {
      // Use getBoundingClientRect for sub-pixel precision
      const rect = ghostRef.current.getBoundingClientRect();
      setTargetWidth(rect.width);
    }
  }, [formattedString]);
  
  return (
    <span className={cn('inline-flex isolate whitespace-nowrap leading-none tabular-nums', !withTextSelect && 'select-none', className)}>
      <span
        className={cn('number-roll-root inline-flex isolate relative ltr contain-layout')}
        style={{ '--duration': `${duration}ms` } as React.CSSProperties}
      >
        {/* Ghost for measurement - must NOT be constrained by container to measure natural width */}
        <span
          ref={ghostRef}
          aria-hidden="true"
          className="absolute left-0 top-0 invisible opacity-0 pointer-events-none leading-none font-[inherit] tabular-nums whitespace-nowrap"
          style={{ 
            letterSpacing: 'calc(var(--digit-width) - 1ch)',
            fontFeatureSettings: '"tnum"',
          } as React.CSSProperties}
        >
          {formattedString}
        </span>

        <span aria-hidden="true" className="number-mask">

          <span
            className="number-roll-sizer"
            style={{
              '--target-width': targetWidth ? `${targetWidth}px` : 'auto',
            } as React.CSSProperties}
          >
            <span className="inline-flex relative">
              {ZWSP}
            {state.tokens.map((token: Token) => {
              if (token.type === 'digit') {
                const digitState: DigitState = {
                  id: token.id,
                  digit: parseInt(token.value, 10) as Digit,
                  phase: token.phase as DigitPhase,
                  fromDigit: token.fromValue ? parseInt(token.fromValue, 10) as Digit : null,
                };
                return (
                  <DigitReel
                    key={token.id}
                    digitState={digitState}
                    onPhaseComplete={handlePhaseComplete}
                  />
                );
              } else {
                return (
                  <SymbolSlot
                    key={token.id}
                    value={token.value}
                    phase={token.phase === 'animating' ? 'idle' : token.phase as 'idle' | 'entering' | 'exiting'}
                    onPhaseComplete={action => handlePhaseComplete(token.id, action)}
                  />
                );
              }
            })}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

export const NumberRoll = React.memo(NumberRollComponent);
NumberRoll.displayName = 'NumberRoll';
