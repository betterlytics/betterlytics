'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedDigitProps {
  digit: number;
  prevDigit: number | null;
  duration?: number;
  easing?: 'spring' | 'ease-out' | 'linear';
  isExiting?: boolean;
  onExitComplete?: () => void;
}

const EASING_MAP = {
  spring: 'cubic-bezier(0.17, 1.15, 0.3, 1)',
  'ease-out': 'ease-out',
  linear: 'linear',
} as const;

const ENTER_EXIT_EASING = 'ease-out';

export function AnimatedDigit({
  digit,
  prevDigit,
  duration = 1000,
  easing = 'spring',
  isExiting = false,
  onExitComplete,
}: AnimatedDigitProps) {
  const reelRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [enterState, setEnterState] = useState<'idle' | 'entering' | 'done'>('idle');
  const [exitState, setExitState] = useState<'idle' | 'exiting' | 'done'>('idle');

  const slideDuration = Math.round(duration / 3);

  // Generate digits above and below current (motion.dev structure)
  const digitsAbove = Array.from({ length: digit }, (_, i) => i);
  const digitsBelow = Array.from({ length: 9 - digit }, (_, i) => digit + 1 + i);

  // Reset states when component is reused (e.g., exit cancelled)
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

  // Handle exit animation
  // Digit becomes absolute and slides LEFT into the mask fade zone while rolling
  useEffect(() => {
    if (isExiting && exitState === 'idle') {
      const reel = reelRef.current;
      const container = containerRef.current;
      
      if (container) {
        // Record current position before going absolute
        const rect = container.getBoundingClientRect();
        const parentRect = container.offsetParent?.getBoundingClientRect();
        const leftPos = parentRect ? rect.left - parentRect.left : 0;
        
        // Become absolute - removes from layout flow
        container.style.position = 'absolute';
        container.style.left = `${leftPos}px`;
        container.offsetHeight; // Force reflow
        
        // Slide LEFT toward the mask edge (into the fade gradient zone)
        container.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        container.style.transform = 'translateX(calc(-1 * var(--mask-width, 0.5em)))';
        container.style.opacity = '0';
      }
      
      if (reel) {
        // Roll the reel (Y transform)
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

  // Handle enter animation - roll UP into view
  useEffect(() => {
    if (isExiting) return;

    if (prevDigit === null && enterState === 'idle') {
      const reel = reelRef.current;
      
      if (reel) {
        // Start below and roll UP into view
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(100%)';
        reel.offsetHeight; // Force reflow
        reel.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        reel.style.transform = 'translateY(0%)';
      }
      
      setEnterState('entering');
      const timer = setTimeout(() => setEnterState('done'), slideDuration);
      return () => clearTimeout(timer);
    }
  }, [prevDigit, enterState, slideDuration, isExiting]);

  // Handle roll animation (digit changes without enter/exit)
  useEffect(() => {
    if (isExiting) return;
    if (prevDigit === null) return;
    if (prevDigit === digit) return;

    const reel = reelRef.current;
    if (!reel) return;

    const offset = digit - prevDigit;
    
    reel.style.transition = 'none';
    reel.style.transform = `translateY(${offset * 100}%)`;
    reel.offsetHeight; // Force reflow
    reel.style.transition = `transform ${duration}ms ${EASING_MAP[easing]}`;
    reel.style.transform = 'translateY(0%)';
  }, [digit, prevDigit, duration, easing, isExiting]);

  if (exitState === 'done') {
    return null;
  }

  const isEntering = enterState === 'entering';
  const isExitingNow = exitState === 'exiting';

  const digitStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: 'calc(var(--mask-height, 0.15em) / 2) 0',
  };

  // Container style
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 'var(--digit-width, 0.65em)',
    // Vertical headroom for roll animation
    padding: 'var(--mask-height, 0.3em) 0',
    margin: 'calc(-1 * var(--mask-height, 0.3em)) 0',
    overflow: 'hidden',
    willChange: 'transform, opacity',
    transformOrigin: 'left center',
  };

  // Reel structure matching motion.dev
  const reelStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    width: 'var(--digit-width, 0.65em)',
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
    <span
      ref={containerRef}
      style={containerStyle}
    >
      {/* Reel with above/current/below structure */}
      <span ref={reelRef} style={reelStyle} aria-hidden="true">
        {/* Digits above current */}
        {(isExitingNow || isEntering || prevDigit !== null) && (
          <span style={aboveStyle}>
            {digitsAbove.map((d) => (
              <span key={`above-${d}`} style={digitStyle}>
                {d}
              </span>
            ))}
          </span>
        )}

        {/* Current digit */}
        <span style={digitStyle}>
          {digit}
        </span>

        {/* Digits below current */}
        {(isExitingNow || isEntering || prevDigit !== null) && (
          <span style={belowStyle}>
            {digitsBelow.map((d) => (
              <span key={`below-${d}`} style={digitStyle}>
                {d}
              </span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}
