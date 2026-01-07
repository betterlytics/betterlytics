'use client';

import { DIGIT_WIDTH, DIGITS, ENTER_EXIT_EASING, MASK_HEIGHT, SPRING_EASING, type Digit, type DigitLifecycle, type ReelMotion } from '@/constants/animations';
import { cn } from '@/lib/utils';
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';

type DigitReelProps = {
  digit: Digit;
  prevDigit: Digit | null;
  duration?: number;
  slideDuration: number;
  lifecycle: DigitLifecycle;
  reelMotion?: ReelMotion;
};

const PADDING_CLASS = `py-[calc(${MASK_HEIGHT}/2)]` as const;
const CONTAINER_PADDING = `py-[calc(${MASK_HEIGHT}/2)] my-[calc(-1*${MASK_HEIGHT}/2)]` as const;

function DigitReelComponent({
  digit,
  prevDigit,
  duration = 1000,
  lifecycle,
  slideDuration,
  reelMotion = 'wheel',
}: DigitReelProps) {
  const [isReeling, setIsReeling] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [isEnteringPhase, setIsEnteringPhase] = useState(lifecycle === 'entering');
  const lastTargetDigit = useRef(digit);

  useLayoutEffect(() => {
    if (lifecycle === 'entering') {
      setIsEnteringPhase(true);
      const rafId = requestAnimationFrame(() => {
        setIsEnteringPhase(false);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [lifecycle]);

  useLayoutEffect(() => {
    if (digit !== lastTargetDigit.current && lifecycle === 'idle' && prevDigit !== null) {
      setResetCount(c => c + 1);
      setIsReeling(false);
      lastTargetDigit.current = digit;
    }
  }, [digit, lifecycle, prevDigit]);

  useLayoutEffect(() => {
    if (resetCount > 0) {
      const rafId = requestAnimationFrame(() => {
        setResetCount(0);
        setIsReeling(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [resetCount]);

  useEffect(() => {
    if (isReeling) {
      const timer = setTimeout(() => setIsReeling(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isReeling, duration, digit]);

  if (lifecycle === 'done') return null;

  const isAnimating = isEnteringPhase || lifecycle === 'exiting';
  
  const containerStyle: React.CSSProperties = {
    opacity: isAnimating ? 0 : 1,
    transition: isAnimating || lifecycle === 'entering'
      ? `opacity ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`
      : 'none',
    width: DIGIT_WIDTH,
  };

  let reelStyle = { transition: 'none', transform: 'translateY(0%)' };

  if (lifecycle === 'exiting') {
    reelStyle = {
      transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
      transform: 'translateY(100%)',
    };
  } else if (lifecycle === 'entering') {
    reelStyle = isEnteringPhase
      ? { transition: 'none', transform: 'translateY(-100%)' }
      : { transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`, transform: 'translateY(0%)' };
  } else if (resetCount > 0) {
    const rawDelta = digit - prevDigit!;
    const delta = reelMotion === 'shortest-path'
      ? (Math.abs(rawDelta) <= 5 ? rawDelta : rawDelta > 0 ? rawDelta - 10 : rawDelta + 10)
      : rawDelta;
    reelStyle = { transition: 'none', transform: `translateY(${delta * 100}%)` };
  } else if (isReeling) {
    reelStyle = {
      transition: `transform ${duration}ms ${SPRING_EASING}`,
      transform: 'translateY(0%)',
    };
  }

  const showReel = lifecycle !== 'idle' || isReeling;

  return (
    <span 
      style={containerStyle}
      className={cn(
        "inline-flex justify-center items-center overflow-visible origin-left will-change-[transform,opacity] motion-reduce:!transition-none",
        CONTAINER_PADDING
      )}
    >
      <span 
        style={{ ...reelStyle, width: DIGIT_WIDTH }}
        className="inline-flex justify-center flex-col items-center relative motion-reduce:!transition-none motion-reduce:!transform-none"
        aria-hidden="true"
      >
        {showReel && (
          <span className="flex flex-col items-center absolute w-full bottom-full left-0 motion-reduce:hidden">
            {DIGITS.slice(0, digit).map((d) => (
              <span key={d} className={cn("inline-block", PADDING_CLASS)}>{d}</span>
            ))}
          </span>
        )}

        <span className={cn("inline-block", PADDING_CLASS)}>{digit}</span>

        {showReel && (
          <span className="flex flex-col items-center absolute w-full top-full left-0 motion-reduce:hidden">
            {DIGITS.slice(digit + 1).map((d) => (
              <span key={d} className={cn("inline-block", PADDING_CLASS)}>{d}</span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
