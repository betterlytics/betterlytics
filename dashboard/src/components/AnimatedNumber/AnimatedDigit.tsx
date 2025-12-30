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

// Use ease-out for enter/exit (no spring overshoot for width)
const ENTER_EXIT_EASING = 'ease-out';

export function AnimatedDigit({
  digit,
  prevDigit,
  duration = 600,
  easing = 'spring',
  isExiting = false,
  onExitComplete,
}: AnimatedDigitProps) {
  const reelRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [enterState, setEnterState] = useState<'idle' | 'entering' | 'done'>('idle');
  const [exitState, setExitState] = useState<'idle' | 'exiting' | 'done'>('idle');

  // Slide duration is 1/3 of roll duration for snappy enter/exit
  const slideDuration = Math.round(duration / 3);

  // Generate digits above and below current
  const digitsAbove = Array.from({ length: digit }, (_, i) => i);
  const digitsBelow = Array.from({ length: 9 - digit }, (_, i) => digit + 1 + i);

  // Reset exit state when component is reused (isExiting goes from true to false)
  useEffect(() => {
    if (!isExiting && exitState !== 'idle') {
      setExitState('idle');
    }
  }, [isExiting, exitState]);

  // Handle exit animation
  useEffect(() => {
    if (isExiting && exitState === 'idle') {
      setExitState('exiting');
      const timer = setTimeout(() => {
        setExitState('done');
        onExitComplete?.();
      }, slideDuration);
      return () => clearTimeout(timer);
    }
  }, [isExiting, exitState, duration, onExitComplete]);

  // Handle enter animation (slide in from 0 width)
  useEffect(() => {
    if (isExiting) return;

    // New digit appearing - animate width and opacity
    if (prevDigit === null && enterState === 'idle') {
      setEnterState('entering');
      const timer = setTimeout(() => setEnterState('done'), slideDuration);
      return () => clearTimeout(timer);
    }
  }, [prevDigit, enterState, duration, isExiting]);

  // Handle roll animation
  useEffect(() => {
    if (isExiting) return;
    if (prevDigit === null) return; // New digit, no roll
    if (prevDigit === digit) return; // Same digit, no animation

    const reel = reelRef.current;
    if (!reel) return;

    setIsAnimating(true);

    // Calculate offset: how many positions to move
    let offset: number;

    if (digit > prevDigit) {
      // Rolling UP: e.g., 1→2 or 0→9 (wrap)
      if (prevDigit === 0 && digit === 9) {
        offset = 9;
      } else {
        offset = digit - prevDigit;
      }
    } else {
      // Rolling DOWN: e.g., 2→1 or 9→0 (wrap)
      if (prevDigit === 9 && digit === 0) {
        offset = -9;
      } else {
        offset = digit - prevDigit;
      }
    }

    // Start position: offset from center
    const startY = -offset * 100;
    reel.style.transition = 'none';
    reel.style.transform = `translateY(${startY}%)`;

    // Force reflow
    reel.offsetHeight;

    // Animate to center (0%)
    reel.style.transition = `transform ${duration}ms ${EASING_MAP[easing]}`;
    reel.style.transform = 'translateY(0%)';

    const handleTransitionEnd = () => {
      setIsAnimating(false);
    };

    reel.addEventListener('transitionend', handleTransitionEnd, { once: true });

    return () => {
      reel.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [digit, prevDigit, duration, easing, isExiting]);

  if (exitState === 'done') {
    return null;
  }

  // Calculate styles based on state
  const isEntering = enterState === 'entering';
  const isExitingNow = exitState === 'exiting';

  const containerStyle: React.CSSProperties = {
    height: '1em',
    // Width animation: 0 → full for enter, full → 0 for exit
    width: isEntering ? '0.65em' : (isExitingNow ? 0 : '0.65em'),
    opacity: isEntering ? 1 : (isExitingNow ? 0 : 1),
    transition: (isEntering || isExitingNow) 
      ? `width ${slideDuration}ms ${ENTER_EXIT_EASING}, opacity ${slideDuration}ms ${ENTER_EXIT_EASING}`
      : undefined,
  };

  // For entering, start at width 0
  if (isEntering && containerRef.current) {
    // We need to set initial width to 0 before the transition kicks in
    // This is handled by the CSS animation below
  }

  return (
    <span
      ref={containerRef}
      className="relative inline-block overflow-clip"
      style={containerStyle}
      // Use CSS animation for enter to get the "from 0" effect
      {...(enterState === 'entering' && {
        'data-entering': 'true',
      })}
    >
      <style>{`
        [data-entering="true"] {
          animation: slideIn ${slideDuration}ms ${ENTER_EXIT_EASING} forwards;
        }
        @keyframes slideIn {
          from { width: 0; opacity: 0; }
          to { width: 0.65em; opacity: 1; }
        }
      `}</style>
      <span
        ref={reelRef}
        className="relative flex flex-col items-center"
        style={{ width: '100%' }}
      >
        {/* Digits above current (for rolling DOWN) */}
        <span
          className="absolute flex flex-col items-center w-full"
          style={{ bottom: '100%' }}
        >
          {digitsAbove.map((d) => (
            <span
              key={`above-${d}`}
              className="flex items-center justify-center"
              style={{ height: '1em' }}
            >
              {d}
            </span>
          ))}
        </span>

        {/* Current digit */}
        <span
          className="flex items-center justify-center"
          style={{ height: '1em' }}
        >
          {digit}
        </span>

        {/* Digits below current (for rolling UP) */}
        <span
          className="absolute flex flex-col items-center w-full"
          style={{ top: '100%' }}
        >
          {digitsBelow.map((d) => (
            <span
              key={`below-${d}`}
              className="flex items-center justify-center"
              style={{ height: '1em' }}
            >
              {d}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}



