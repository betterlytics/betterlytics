// Internal component - use AnimatedNumber instead
'use client';

import { useEffect, useRef, useState } from 'react';
import { DIGIT_WIDTH, MASK_HEIGHT, MASK_WIDTH, SPRING_EASING, ENTER_EXIT_EASING } from '@/constants/animations';

interface DigitReelProps {
  digit: number;
  prevDigit: number | null;
  duration?: number;
  slideDuration: number;
  isExiting?: boolean;
  onExitComplete?: () => void;
}

export function DigitReel({
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

  const digitsAbove = Array.from({ length: digit }, (_, i) => i);
  const digitsBelow = Array.from({ length: 9 - digit }, (_, i) => digit + 1 + i);

  useEffect(() => {
    if (!isExiting && exitState !== 'idle') {
      setExitState('idle');
      setEnterState('idle');
      const reel = reelRef.current;
      const container = containerRef.current;
      if (reel) {
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0%)';
      }
      if (container) {
        container.style.transition = 'none';
        container.style.position = 'relative';
        container.style.left = 'auto';
        container.style.opacity = '1';
        container.style.transform = 'none';
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
        
        container.style.position = 'absolute';
        container.style.left = `${leftPos}px`;
        container.offsetHeight;
        
        container.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        container.style.transform = `translateX(calc(-1 * ${MASK_WIDTH}))`;
        container.style.opacity = '0';
      }
      
      if (reel) {
        reel.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        reel.style.transform = 'translateY(100%)';
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
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(100%)';
        reel.offsetHeight;
        reel.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        reel.style.transform = 'translateY(0%)';
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
    
    reel.style.transition = 'none';
    reel.style.transform = `translateY(${offset * 100}%)`;
    reel.offsetHeight;
    reel.style.transition = `transform ${duration}ms ${SPRING_EASING}`;
    reel.style.transform = 'translateY(0%)';
  }, [digit, prevDigit, duration, isExiting]);

  if (exitState === 'done') {
    return null;
  }

  const isEntering = enterState === 'entering';
  const isExitingNow = exitState === 'exiting';

  const digitStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: `calc(${MASK_HEIGHT} / 2) 0`,
  };

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: DIGIT_WIDTH,
    padding: `${MASK_HEIGHT} 0`,
    margin: `calc(-1 * ${MASK_HEIGHT}) 0`,
    overflow: 'hidden',
    willChange: 'transform, opacity',
    transformOrigin: 'left center',
  };

  const reelStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    width: DIGIT_WIDTH,
  };

  const aboveStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    bottom: '100%',
    left: 0,
  };

  const belowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    top: '100%',
    left: 0,
  };

  return (
    <span ref={containerRef} style={containerStyle}>
      <span ref={reelRef} style={reelStyle} aria-hidden="true">
        {(isExitingNow || isEntering || prevDigit !== null) && (
          <span style={aboveStyle}>
            {digitsAbove.map((d) => (
              <span key={`above-${d}`} style={digitStyle}>{d}</span>
            ))}
          </span>
        )}

        <span style={digitStyle}>{digit}</span>

        {(isExitingNow || isEntering || prevDigit !== null) && (
          <span style={belowStyle}>
            {digitsBelow.map((d) => (
              <span key={`below-${d}`} style={digitStyle}>{d}</span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}
