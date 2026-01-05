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
  const lastTargetDigit = useRef(digit);

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

  const containerStyle: React.CSSProperties = {
    opacity: lifecycle === 'exiting' ? 0 : 1,
    transition: lifecycle === 'exiting' 
      ? `opacity ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`
      : 'none',
    width: DIGIT_WIDTH,
  };

  let reelTransition = 'none';
  let reelTransform = 'translateY(0%)';

  if (lifecycle === 'exiting') {
    reelTransition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
    reelTransform = 'translateY(100%)';
  } else if (lifecycle === 'entering') {
    reelTransition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
    reelTransform = 'translateY(0%)';
  } else if (resetCount > 0) {
    const rawDelta = digit - prevDigit!;
    const delta = reelMotion === 'shortest-path'
      ? (Math.abs(rawDelta) <= 5 ? rawDelta : rawDelta > 0 ? rawDelta - 10 : rawDelta + 10)
      : rawDelta;
    
    reelTransition = 'none';
    reelTransform = `translateY(${delta * 100}%)`;
  } else if (isReeling) {
    reelTransition = `transform ${duration}ms ${SPRING_EASING}`;
    reelTransform = 'translateY(0%)';
  }

  const showReel = lifecycle !== 'idle' || isReeling;

  return (
    <span 
      style={containerStyle}
      className={cn(
        "inline-flex justify-center items-center overflow-hidden origin-left will-change-[transform,opacity] motion-reduce:!transition-none",
        CONTAINER_PADDING
      )}
    >
      <span 
        style={{ 
          transition: reelTransition, 
          transform: reelTransform,
          width: DIGIT_WIDTH 
        }}
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
