'use client';

import { DIGIT_WIDTH, ENTER_EXIT_EASING, MASK_HEIGHT, SPRING_EASING } from '@/constants/animations';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';

type DigitReelProps = {
  digit: number;
  prevDigit: number | null;
  duration?: number;
  slideDuration: number;
  isExiting?: boolean;
  onExitComplete?: () => void;
};

function DigitReelComponent({
  digit,
  prevDigit,
  duration = 1000,
  slideDuration,
  isExiting = false,
  onExitComplete,
}: DigitReelProps) {
  const reelRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [enterState, setEnterState] = useState<'idle' | 'entering' | 'done'>('idle');
  const [exitState, setExitState] = useState<'idle' | 'exiting' | 'done'>('idle');

  useEffect(() => {
    if (!isExiting && exitState !== 'idle') {
      setExitState('idle');
      setEnterState('idle');
      if (reelRef.current) {
        Object.assign(reelRef.current.style, { transition: 'none', transform: 'translateY(0%)' });
      }
      if (containerRef.current) {
        Object.assign(containerRef.current.style, { 
          transition: 'none', 
          opacity: '1', 
          transform: 'none' 
        });
      }
    }
  }, [isExiting, exitState]);

  useEffect(() => {
    if (isExiting && exitState === 'idle') {
      if (containerRef.current) {
        // Ticker Tape: Keep digits in flow, just fade and roll out relative to container
        Object.assign(containerRef.current.style, { 
          transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          opacity: '0'
        });
      }
      
      if (reelRef.current) {
        Object.assign(reelRef.current.style, { 
          transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          transform: 'translateY(100%)'
        });
      }
      
      setExitState('exiting');
      const postExitCleanup = setTimeout(() => {
        setExitState('done');
        onExitComplete?.();
      }, slideDuration);
      return () => clearTimeout(postExitCleanup);
    }
  }, [isExiting, exitState, slideDuration, onExitComplete]);

  useEffect(() => {
    if (isExiting) return;

    if (prevDigit === null && enterState === 'idle') {
      if (reelRef.current) {
        Object.assign(reelRef.current.style, { transition: 'none', transform: 'translateY(100%)' });
        void reelRef.current.offsetHeight; // force reflow
        Object.assign(reelRef.current.style, { 
          transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          transform: 'translateY(0%)'
        });
      }
      
      setEnterState('entering');
      const postEnterCleanup = setTimeout(() => setEnterState('done'), slideDuration);
      return () => clearTimeout(postEnterCleanup);
    }
  }, [prevDigit, enterState, slideDuration, isExiting]);

  useEffect(() => {
    if (isExiting || prevDigit === null || prevDigit === digit || !reelRef.current) return;
    
    Object.assign(reelRef.current.style, { transition: 'none', transform: `translateY(${(digit - prevDigit) * 100}%)` });
    void reelRef.current.offsetHeight; // force reflow
    Object.assign(reelRef.current.style, { 
      transition: `transform ${duration}ms ${SPRING_EASING}`,
      transform: 'translateY(0%)'
    });
  }, [digit, prevDigit, duration, isExiting]);

  if (exitState === 'done') {
    return null;
  }

  return (
    <span 
      ref={containerRef} 
      className={cn(
        "inline-flex justify-center items-center overflow-hidden origin-left will-change-[transform,opacity]",
        `w-[${DIGIT_WIDTH}] py-[calc(${MASK_HEIGHT}/2)] my-[calc(-1*${MASK_HEIGHT}/2)]`
      )}
    >
      <span 
        ref={reelRef} 
        className={cn("inline-flex justify-center flex-col items-center relative", `w-[${DIGIT_WIDTH}]`)}
        aria-hidden="true"
      >
        {(exitState === 'exiting' || enterState === 'entering' || prevDigit !== null) && (
          <span className="flex flex-col items-center absolute w-full bottom-full left-0">
            {Array.from({ length: digit }, (_, i) => i).map((d) => (
              <span key={`above-${d}`} className={cn("inline-block", `py-[calc(${MASK_HEIGHT}/2)]`)}>{d}</span>
            ))}
          </span>
        )}

        <span className={cn("inline-block", `py-[calc(${MASK_HEIGHT}/2)]`)}>{digit}</span>

        {(exitState === 'exiting' || enterState === 'entering' || prevDigit !== null) && (
          <span className="flex flex-col items-center absolute w-full top-full left-0">
            {Array.from({ length: 9 - digit }, (_, i) => digit + 1 + i).map((d) => (
              <span key={`below-${d}`} className={cn("inline-block", `py-[calc(${MASK_HEIGHT}/2)]`)}>{d}</span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}


export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
