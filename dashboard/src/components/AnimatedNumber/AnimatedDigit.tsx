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

  // Reset states when component is reused
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
        container.style.transform = 'none';
      }
    }
  }, [isExiting, exitState]);

  // Handle exit animation - become absolute and slide out toward left edge
  useEffect(() => {
    if (isExiting && exitState === 'idle') {
      const reel = reelRef.current;
      const container = containerRef.current;
      
      if (container) {
        // Get current position before becoming absolute
        const rect = container.getBoundingClientRect();
        const parentRect = container.parentElement?.getBoundingClientRect();
        const leftOffset = parentRect ? rect.left - parentRect.left : 0;
        
        // Become absolute positioned - this removes it from layout flow
        // The container width will shrink and push other digits to fill the gap
        container.style.position = 'absolute';
        container.style.left = `${leftOffset}px`;
        container.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        
        // Slide out toward left edge (negative X) and fade
        container.style.transform = 'translate3d(calc(-0.5 * var(--digit-width, 0.65em)), 0, 0) scale(1.02, 1)';
        container.style.opacity = '0';
      }
      
      if (reel) {
        // Roll the reel
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

  // Handle enter animation - start collapsed, roll UP into view
  useEffect(() => {
    if (isExiting) return;

    if (prevDigit === null && enterState === 'idle') {
      const reel = reelRef.current;
      const container = containerRef.current;
      
      if (container) {
        // Start with offset and scale
        container.style.transition = 'none';
        container.style.transform = 'translate3d(calc(-0.33 * var(--digit-width, 0.65em)), 0, 0) scale(1.02, 1)';
        container.style.opacity = '0';
        container.offsetHeight; // Force reflow
        // Animate to normal
        container.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        container.style.transform = 'none';
        container.style.opacity = '1';
      }
      
      if (reel) {
        // Start showing digit below and roll UP into view
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

  // Handle roll animation (digit changes)
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

  // Container handles positioning - motion.dev style
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
    transformOrigin: '50% 50% 0px',
    // Opacity handled by JS animations, not React state
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
      {/* Reel with above/current/below structure - matches motion.dev */}
      <span ref={reelRef} style={reelStyle} aria-hidden="true">
        {/* Digits above current (position: absolute at bottom: 100%) */}
        {(isExitingNow || isEntering || prevDigit !== null) && (
          <span style={aboveStyle}>
            {digitsAbove.map((d) => (
              <span key={`above-${d}`} style={digitStyle}>
                {d}
              </span>
            ))}
          </span>
        )}

        {/* Current digit - in normal flow, sets the reel height */}
        <span style={digitStyle}>
          {digit}
        </span>

        {/* Digits below current (position: absolute at top: 100%) */}
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
