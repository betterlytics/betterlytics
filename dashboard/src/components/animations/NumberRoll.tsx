'use client';

import './styles.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type PrevTokenData = { x: number; digit?: number };

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
  const tokenRefsMap = useRef<Map<string, HTMLSpanElement>>(new Map());
  const prevTokenData = useRef<Map<string, PrevTokenData>>(new Map());

  const setTokenRef = useCallback((id: string, el: HTMLSpanElement | null) => {
    if (el) {
      tokenRefsMap.current.set(id, el);
    } else {
      tokenRefsMap.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (rawParts === state.parts) {
      if (ghostRef.current && sizerRef.current) {
        const width = ghostRef.current.getBoundingClientRect().width;
        sizerRef.current.style.setProperty('--ba-target-width', `${width}px`);
      }
      return;
    }

    prevTokenData.current.clear();
    state.tokens.forEach((token) => {
      const el = tokenRefsMap.current.get(token.id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      prevTokenData.current.set(token.id, {
        x: rect.x,
        digit: token.type === 'digit' ? parseInt(token.value, 10) : undefined,
      });
    });

    const newTokens = diffTokens(state.tokens, rawParts);

    setState(() => ({ tokens: newTokens, parts: rawParts }));

    newTokens.forEach((token) => {
      const el = tokenRefsMap.current.get(token.id);
      const prev = prevTokenData.current.get(token.id);
      if (!el) return;

      // el.getAnimations().forEach((a) => a.cancel());

      if (prev) {
        const curr = el.getBoundingClientRect();
        const dx = prev.x - curr.x;

        if (Math.abs(dx) > 0.5) {
          el.animate([{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }], {
            duration,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          });
        }

        if (token.type === 'digit' && prev.digit !== undefined) {
          const newDigit = parseInt(token.value, 10);
          if (prev.digit !== newDigit) {
            const inner = el.querySelector('.ba-digit-reel-inner') as HTMLElement;
            if (inner) {
              // inner.getAnimations().forEach((a) => a.cancel());
              const fromOffset = -prev.digit * 10;
              const toOffset = -newDigit * 10;
              inner.animate(
                [
                  { transform: `translate3d(0, ${fromOffset}%, 0)` },
                  { transform: `translate3d(0, ${toOffset}%, 0)` },
                ],
                { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
              );
            }
          }
        }
      }
    });

    if (ghostRef.current && sizerRef.current) {
      const width = ghostRef.current.getBoundingClientRect().width;
      sizerRef.current.style.setProperty('--ba-target-width', `${width}px`);
    }
  }, [rawParts, state.parts, duration]);

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
                    ref={(el) => setTokenRef(token.id, el)}
                    digit={parseInt(token.value, 10) as Digit}
                    phase={token.phase as DigitPhase}
                  />
                ) : (
                  <SymbolSlot
                    key={token.id}
                    ref={(el) => setTokenRef(token.id, el)}
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
