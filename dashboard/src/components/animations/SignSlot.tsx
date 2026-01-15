'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAnimatedConfig } from './context';

type SignPhase = 'idle' | 'entering' | 'exiting';

type SignSlotProps = {
  isNegative: boolean;
};

/**
 * SignSlot - Animated minus sign for negative numbers.
 * Self-contained: manages its own enter/exit phase based on isNegative prop.
 * Animates width + opacity only (no roll), positioned before the masked digit area.
 */
function SignSlotComponent({ isNegative }: SignSlotProps) {
  const { duration } = useAnimatedConfig();
  
  const prevNegativeRef = useRef<boolean | null>(null);
  const [phase, setPhase] = useState<SignPhase | 'hidden'>(() => 
    isNegative ? 'idle' : 'hidden'
  );

  // Handle phase transitions based on isNegative changes
  useLayoutEffect(() => {
    const wasNegative = prevNegativeRef.current;
    
    if (wasNegative === null) {
      // Initial render - no animation
      setPhase(isNegative ? 'idle' : 'hidden');
    } else if (isNegative && !wasNegative) {
      // Becoming negative - enter animation
      setPhase('entering');
    } else if (!isNegative && wasNegative) {
      // Becoming positive - exit animation
      setPhase('exiting');
    }
    
    prevNegativeRef.current = isNegative;
  }, [isNegative]);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    
    if (e.animationName.includes('sign-exit')) {
      setPhase('hidden');
    } else if (e.animationName.includes('sign-enter')) {
      setPhase('idle');
    }
  }, []);

  const style = useMemo(() => ({
    '--duration': `${duration}ms`,
  } as React.CSSProperties), [duration]);

  // Don't render when hidden
  if (phase === 'hidden') {
    return null;
  }

  return (
    <span
      className={cn(
        'sign-slot inline-flex justify-center items-center select-none',
        'motion-reduce:[--reduced-duration:0ms]'
      )}
      style={style}
      data-phase={phase}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className="sign-slot-inner">−</span>
    </span>
  );
}

export const SignSlot = React.memo(SignSlotComponent);
SignSlot.displayName = 'SignSlot';
