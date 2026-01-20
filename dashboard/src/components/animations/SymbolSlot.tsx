'use client';

import { cn } from '@/lib/utils';
import React, { useCallback } from 'react';

const ZWSP = '\u200B';

export type SymbolPhase = 'idle' | 'entering' | 'exiting';

type SymbolSlotProps = {
  key?: React.Key;
  value: string;
  phase: SymbolPhase;
  onPhaseComplete?: (action: 'entered' | 'exited') => void;
};

/**
 * SymbolSlot - Animated symbol (sign, separator, currency, etc.)
 * Animates width + opacity only (no roll).
 */
function SymbolSlotComponent({ value, phase, onPhaseComplete }: SymbolSlotProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  // Measure natural width to support smooth exit animation
  React.useLayoutEffect(() => {
    if (ref.current && (phase === 'idle' || phase === 'entering')) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.width > 0) {
        ref.current.style.setProperty('--measured-width', `${rect.width}px`);
      }
    }
  }, [value, phase]);

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== e.currentTarget) return;

      // symbol-exit controls the width animation - use it to trigger removal
      if (e.animationName.includes('symbol-exit') && onPhaseComplete) {
        onPhaseComplete('exited');
      } else if (e.animationName.includes('fade-in') && onPhaseComplete) {
        onPhaseComplete('entered');
      }
    },
    [onPhaseComplete],
  );

  // Render ZWSP when hidden for consistent DOM structure
  if (phase === 'exited' as string) {
    return <span className="symbol-slot-hidden">{ZWSP}</span>;
  }

  return (
    <span
      ref={ref}
      className={cn(
        'symbol-slot inline-flex items-center justify-center whitespace-nowrap',
        'motion-reduce:[--reduced-duration:0ms]',
      )}
      data-phase={phase}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className="symbol-slot-inner">{value}</span>
    </span>
  );
}

export const SymbolSlot = React.memo(SymbolSlotComponent);
SymbolSlot.displayName = 'SymbolSlot';
