'use client';

import { DIGIT_WIDTH, ENTER_EXIT_EASING, MASK_HEIGHT, SPRING_EASING } from '@/constants/animations';
import { cn } from '@/lib/utils';
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { type DigitLifecycle } from './AnimatedNumber';

type DigitReelProps = {
  digit: number;
  prevDigit: number | null;
  duration?: number;
  slideDuration: number;
  lifecycle: DigitLifecycle;
};

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const PADDING_CLASS = `py-[calc(${MASK_HEIGHT}/2)]`;
const CONTAINER_PADDING = `py-[calc(${MASK_HEIGHT}/2)] my-[calc(-1*${MASK_HEIGHT}/2)]`;

function DigitReelComponent({
  digit,
  prevDigit,
  duration = 1000,
  lifecycle,
  slideDuration,
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
    reelTransition = 'none';
    reelTransform = `translateY(${(digit - prevDigit!) * 100}%)`;
  } else if (isReeling) {
    reelTransition = `transform ${duration}ms ${SPRING_EASING}`;
    reelTransform = 'translateY(0%)';
  }

  const showReel = lifecycle !== 'idle' || isReeling;

  return (
    <span 
      style={containerStyle}
      className={cn(
        "inline-flex justify-center items-center overflow-hidden origin-left will-change-[transform,opacity]",
        CONTAINER_PADDING
      )}
    >
      <span 
        style={{ 
          transition: reelTransition, 
          transform: reelTransform,
          width: DIGIT_WIDTH 
        }}
        className="inline-flex justify-center flex-col items-center relative"
        aria-hidden="true"
      >
        {showReel && (
          <span className="flex flex-col items-center absolute w-full bottom-full left-0">
            {DIGITS.slice(0, digit).map((d) => (
              <span key={d} className={cn("inline-block", PADDING_CLASS)}>{d}</span>
            ))}
          </span>
        )}

        <span className={cn("inline-block", PADDING_CLASS)}>{digit}</span>

        {showReel && (
          <span className="flex flex-col items-center absolute w-full top-full left-0">
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
