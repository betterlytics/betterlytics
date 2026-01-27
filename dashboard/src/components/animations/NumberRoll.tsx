'use client';

import './styles.css';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from './utils';
import { ZeroWidthSpace } from './ZeroWidthSpace';
import { DigitReel } from './DigitReel';
import { SymbolSlot } from './SymbolSlot';
import { type Token, diffTokens, createInitialTokens, type DigitPhase, type Digit } from './tokens';

export type NumberRollProps = {
  value: number;
  locales?: Intl.LocalesArgument;
  formatOptions?: Intl.NumberFormatOptions;
  duration?: number;
  withTextSelect?: boolean;
  className?: string;
};

export function NumberRoll({
  value,
  locales,
  formatOptions,
  duration = 600,
  withTextSelect = false,
  className,
}: NumberRollProps) {
  const resolvedLocales = locales ?? 'en-US';

  const formatter = useMemo(
    () => new Intl.NumberFormat(resolvedLocales, formatOptions),
    [resolvedLocales, formatOptions],
  );

  const rawParts = useMemo(() => formatter.formatToParts(value), [formatter, value]);
  const formattedString = useMemo(() => formatter.format(value), [formatter, value]);

  const [state, setState] = useState(() => ({
    tokens: createInitialTokens(rawParts),
    parts: rawParts,
  }));

  const ghostRef = useRef<HTMLSpanElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setState((prev) => {
      if (rawParts === prev.parts) return prev;
      return {
        tokens: diffTokens(prev.tokens, prev.parts, rawParts),
        parts: rawParts,
      };
    });

    if (ghostRef.current && sizerRef.current) {
      const width = ghostRef.current.getBoundingClientRect().width;
      sizerRef.current.style.setProperty('--ba-target-width', `${width}px`);
    }
  }, [rawParts, formattedString]);

  return (
    <span className={cn('ba-number-roll-outer', !withTextSelect && 'ba-no-select', className)}>
      <span className='ba-number-roll-root' style={{ '--ba-duration': `${duration}ms` } as React.CSSProperties}>
        <span
          ref={ghostRef}
          aria-hidden='true'
          className='ba-number-roll-ghost'
          style={
            {
              letterSpacing: 'calc(var(--ba-digit-width) - 1ch)',
              fontFeatureSettings: '"tnum"',
            } as React.CSSProperties
          }
        >
          {formattedString}
        </span>

        <span aria-hidden='true' className='ba-number-mask'>
          <span ref={sizerRef} className='ba-number-roll-sizer'>
            <span className='ba-number-roll-tokens'>
              <ZeroWidthSpace />
              {state.tokens.map((token: Token) =>
                token.type === 'digit' ? (
                  <DigitReel
                    key={token.id}
                    digit={parseInt(token.value, 10) as Digit}
                    phase={token.phase as DigitPhase}
                  />
                ) : (
                  <SymbolSlot
                    key={token.id}
                    value={token.value}
                    phase={token.phase as 'idle' | 'entering' | 'exiting' | 'animating'}
                    fromValue={token.fromValue}
                  />
                ),
              )}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}
