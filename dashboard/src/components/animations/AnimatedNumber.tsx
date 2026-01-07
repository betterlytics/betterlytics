'use client';

import { DigitReel } from '@/components/animations/DigitReel';
import { DIGIT_WIDTH, ENTER_SCALE, ENTER_TRANSFORM_OFFSET, MASK_HEIGHT, ZWSP, getMaskStyles, type ReelMotion } from '@/constants/animated-number';
import { useDigitDiff } from '@/hooks/useDigitDiff';
import { useLayoutTransitionSuppression } from '@/hooks/useLayoutTransitionSuppression';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';

type AnimatedNumberProps = {
  value: number;
  className?: string;
  duration?: number;
  /** Controls how digit reels animate: 'wheel' (default) scrolls through all digits, 'shortest-path' takes the shortest route */
  reelMotion?: ReelMotion;
};

export function AnimatedNumber({
  value,
  className,
  duration = 1200,
  reelMotion = 'wheel',
}: AnimatedNumberProps) {
  const { digitStates, setDigitStates } = useDigitDiff({ value });

  const activeDigitCount = digitStates.filter(d => d.lifecycle !== 'exiting' && d.lifecycle !== 'done').length || 1;
  const exitingDigitCount = digitStates.filter(d => d.lifecycle === 'exiting').length;
  const hasEnteringDigits = digitStates.some(d => d.lifecycle === 'entering');

  const slideDuration = Math.round(duration / Math.max(activeDigitCount + exitingDigitCount, 1));

  // Handle Lifecycle Transitions (Clearing Enter/Exit flags)
  useEffect(() => {
    const hasActivePhases = digitStates.some(d => d.lifecycle === 'entering' || d.lifecycle === 'exiting');
    if (!hasActivePhases) return;

    const timer = setTimeout(() => {
      setDigitStates(prev => prev
        .filter(d => d.lifecycle !== 'done')
        .map(d => {
          if (d.lifecycle === 'entering') return { ...d, lifecycle: 'idle' as const };
          if (d.lifecycle === 'exiting') return { ...d, lifecycle: 'done' as const };
          return d;
        })
      );
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [digitStates, slideDuration, setDigitStates]);

  useEffect(() => {
    const heartbeat = setTimeout(() => {
      setDigitStates(prev => prev
        .filter(d => d.lifecycle !== 'done')
        .map(s => ({ ...s, prevDigit: s.digit, lifecycle: 'idle' as const }))
      );
    }, duration + 100);
    return () => clearTimeout(heartbeat);
  }, [value, duration, setDigitStates]);

  // Suppress transitions for one frame when digits are entering and expanding
  const lastActiveDigitCount = useRef(activeDigitCount);
  const isExpanding = activeDigitCount > lastActiveDigitCount.current;
  const isSuppressing = useLayoutTransitionSuppression(hasEnteringDigits && isExpanding);

  // Update ref after suppression check
  useEffect(() => {
    lastActiveDigitCount.current = activeDigitCount;
  }, [activeDigitCount]);

  const maskStyles = useMemo(() => getMaskStyles(), []);

  const sectionStyle: React.CSSProperties = {
    transition: isSuppressing
      ? 'none'
      : `width ${slideDuration}ms ease-out, transform ${slideDuration}ms ease-out`,
    width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
    transform: isSuppressing
      ? `translate3d(calc(${ENTER_TRANSFORM_OFFSET} * ${DIGIT_WIDTH}), 0, 0) scale(${ENTER_SCALE}, 1)`
      : 'none'
  };

  return (
    <span className={cn('inline-flex tabular-nums leading-none isolate whitespace-nowrap motion-reduce:!transition-none', className)}>
      <span
        aria-label={value.toString()}
        className="inline-flex ltr isolate relative -z-10"
      >
        <span
          aria-hidden="true"
          className={`animated-number-pre inline-flex justify-end w-0 py-[calc(${MASK_HEIGHT}/2)]`}
        >
          <span className="inline-flex justify-inherit relative">{ZWSP}</span>
        </span>

        <span aria-hidden="true" style={maskStyles}>
          <span
            style={sectionStyle}
            className="animated-number-integer inline-flex justify-end origin-left motion-reduce:!transition-none motion-reduce:!transform-none"
          >
            <span className="inline-flex justify-inherit relative">
              {ZWSP}
              {digitStates.filter(d => d.lifecycle !== 'done').map((state) => (
                <DigitReel
                  key={state.id}
                  digit={state.digit}
                  prevDigit={state.prevDigit}
                  duration={duration}
                  slideDuration={slideDuration}
                  lifecycle={state.lifecycle}
                  reelMotion={reelMotion}
                />
              ))}
            </span>
          </span>

          <span className="animated-number-fraction inline-flex justify-start w-0">
            <span className="inline-flex justify-inherit relative">{ZWSP}</span>
          </span>
        </span>

        <span
          aria-hidden="true"
          className={`animated-number-post inline-flex justify-start w-0 py-[calc(${MASK_HEIGHT}/2)]`}
        >
          <span className="inline-flex justify-inherit relative">{ZWSP}</span>
        </span>
      </span>
    </span>
  );
}
