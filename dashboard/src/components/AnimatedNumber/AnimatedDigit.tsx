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
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'ease-out': 'ease-out',
  linear: 'linear',
} as const;

const ENTER_EXIT_EASING = 'ease-out';

export function AnimatedDigit({
  digit,
  prevDigit,
  duration = 1800,
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
      if (reel) {
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0%)';
      }
    }
  }, [isExiting]);

  // Handle exit animation
  useEffect(() => {
    if (isExiting && exitState === 'idle') {
      const reel = reelRef.current;
      if (reel) {
        reel.style.transition = `transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        reel.style.transform = 'translateY(-100%)';
      }
      
      setExitState('exiting');
      const timer = setTimeout(() => {
        setExitState('done');
        onExitComplete?.();
      }, slideDuration);
      return () => clearTimeout(timer);
    }
  }, [isExiting, exitState, slideDuration, onExitComplete]);

  // Handle enter animation
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

  // Handle roll animation (digit changes)
  useEffect(() => {
    if (isExiting) return;
    if (prevDigit === null) return;
    if (prevDigit === digit) return;

    const reel = reelRef.current;
    if (!reel) return;

    // Calculate offset: digit - prevDigit
    // 4→5: offset = 1, translateY(-100%) starts with above section (4) visible
    // 5→4: offset = -1, translateY(100%) starts with below section (5) visible  
    const offset = digit - prevDigit;
    
    // Start at position showing prevDigit, animate to 0 (showing current digit)
    reel.style.transition = 'none';
    reel.style.transform = `translateY(${offset * 100}%)`;
    reel.offsetHeight;
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

  // Container handles width animation - NO overflow, parent mask clips
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    width: isExitingNow ? 0 : '0.65em',
    transition: (isEntering || isExitingNow) 
      ? `width ${slideDuration}ms ${ENTER_EXIT_EASING}`
      : undefined,
  };

  // Reel contains: above (absolute), current (normal flow), below (absolute)
  // Only current digit contributes to height
  const reelStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    width: '0.65em',
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
      data-entering={isEntering ? 'true' : undefined}
      aria-hidden="true"
    >
      <style>{`
        [data-entering="true"] {
          animation: slideInWidth ${slideDuration}ms ${ENTER_EXIT_EASING} forwards;
        }
        @keyframes slideInWidth {
          from { width: 0; }
          to { width: 0.65em; }
        }
      `}</style>
      {/* Reel with above/current/below structure - only current is in normal flow */}
      <span ref={reelRef} style={reelStyle}>
        {/* Digits above current (position: absolute at bottom: 100%) */}
        <span style={aboveStyle}>
          {digitsAbove.map((d) => (
            <span key={`above-${d}`} style={digitStyle}>
              {d}
            </span>
          ))}
        </span>

        {/* Current digit - in normal flow, sets the reel height */}
        <span style={digitStyle}>
          {digit}
        </span>

        {/* Digits below current (position: absolute at top: 100%) */}
        <span style={belowStyle}>
          {digitsBelow.map((d) => (
            <span key={`below-${d}`} style={digitStyle}>
              {d}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
