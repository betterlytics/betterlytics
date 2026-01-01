'use client';

import { DIGIT_WIDTH, ENTER_EXIT_EASING, MASK_HEIGHT, MASK_WIDTH, SPRING_EASING } from '@/constants/animations';
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
      const reel = reelRef.current;
      const container = containerRef.current;
      if (reel) {
        Object.assign(reel.style, { transition: 'none', transform: 'translateY(0%)' });
      }
      if (container) {
        Object.assign(container.style, { 
          transition: 'none', 
          position: 'relative', 
          left: 'auto', 
          opacity: '1', 
          transform: 'none' 
        });
      }
    }
  }, [isExiting, exitState]);

  useEffect(() => {
    if (isExiting && exitState === 'idle') {
      const reel = reelRef.current;
      const container = containerRef.current;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        const parentRect = container.offsetParent?.getBoundingClientRect();
        const leftPos = parentRect ? rect.left - parentRect.left : 0;
        
        Object.assign(container.style, { position: 'absolute', left: `${leftPos}px` });
        container.offsetHeight; // force reflow
        Object.assign(container.style, { 
          transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          transform: `translateX(calc(-1 * ${MASK_WIDTH}))`,
          opacity: '0'
        });
      }
      
      if (reel) {
        Object.assign(reel.style, { 
          transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          transform: 'translateY(100%)'
        });
      }
      
      setExitState('exiting');
      const timer = setTimeout(() => {
        setExitState('done');
        onExitComplete?.();
      }, slideDuration);
      return () => clearTimeout(timer);
    }
  }, [isExiting, exitState, slideDuration, onExitComplete]);

  useEffect(() => {
    if (isExiting) return;

    if (prevDigit === null && enterState === 'idle') {
      const reel = reelRef.current;
      
      if (reel) {
        Object.assign(reel.style, { transition: 'none', transform: 'translateY(100%)' });
        reel.offsetHeight; // force reflow
        Object.assign(reel.style, { 
          transition: `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          transform: 'translateY(0%)'
        });
      }
      
      setEnterState('entering');
      const timer = setTimeout(() => setEnterState('done'), slideDuration);
      return () => clearTimeout(timer);
    }
  }, [prevDigit, enterState, slideDuration, isExiting]);

  useEffect(() => {
    if (isExiting) return;
    if (prevDigit === null) return;
    if (prevDigit === digit) return;

    const reel = reelRef.current;
    if (!reel) return;

    const offset = digit - prevDigit;
    
    Object.assign(reel.style, { transition: 'none', transform: `translateY(${offset * 100}%)` });
    reel.offsetHeight; // force reflow
    Object.assign(reel.style, { 
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
      className={`inline-flex justify-center items-center overflow-hidden origin-left w-[${DIGIT_WIDTH}] py-[${MASK_HEIGHT}] my-[calc(-1*${MASK_HEIGHT})]`}
      style={{ willChange: 'transform, opacity' }}
    >
      <span 
        ref={reelRef} 
        className={`inline-flex justify-center flex-col items-center relative w-[${DIGIT_WIDTH}]`}
        aria-hidden="true"
      >
        {(exitState === 'exiting' || enterState === 'entering' || prevDigit !== null) && (
          <span className="flex flex-col items-center absolute w-full bottom-full left-0">
            {Array.from({ length: digit }, (_, i) => i).map((d) => (
              <span key={`above-${d}`} className={`inline-block py-[calc(${MASK_HEIGHT}/2)]`}>{d}</span>
            ))}
          </span>
        )}

        <span className={`inline-block py-[calc(${MASK_HEIGHT}/2)]`}>{digit}</span>

        {(exitState === 'exiting' || enterState === 'entering' || prevDigit !== null) && (
          <span className="flex flex-col items-center absolute w-full top-full left-0">
            {Array.from({ length: 9 - digit }, (_, i) => digit + 1 + i).map((d) => (
              <span key={`below-${d}`} className={`inline-block py-[calc(${MASK_HEIGHT}/2)]`}>{d}</span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = 'DigitReel';
