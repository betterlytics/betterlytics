'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

const ZWSP = '\u200B';

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

  // Render ZWSP when hidden for consistent DOM structure
  if (phase === 'hidden') {
    return <span className="sign-slot-hidden">{ZWSP}</span>;
  }

  return (
    <span
      className={cn(
        'sign-slot inline-flex justify-center items-center select-none',
        'motion-reduce:[--reduced-duration:0ms]'
      )}
      data-phase={phase}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className="sign-slot-inner">−</span>
    </span>
  );
}

export const SignSlot = React.memo(SignSlotComponent);
SignSlot.displayName = 'SignSlot';
