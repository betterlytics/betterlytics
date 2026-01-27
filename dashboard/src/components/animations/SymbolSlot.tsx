'use client';

import React, { useCallback } from 'react';
import { ZeroWidthSpace } from './ZeroWidthSpace';

export type SymbolPhase = 'idle' | 'entering' | 'exiting' | 'animating';

type SymbolSlotProps = {
  id: string;
  value: string;
  phase: SymbolPhase;
  fromValue?: string;
  onPhaseComplete: (id: string, action: 'entered' | 'exited' | 'completed') => void;
};

/**
 * SymbolSlot - Animated symbol (sign, separator, currency, etc.)
 * Animates width + opacity. For cross-fade transitions, renders both old and new
 * values overlapping with absolute positioning.
 */
function SymbolSlotComponent({ id, value, phase, fromValue, onPhaseComplete }: SymbolSlotProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  // Measure natural width to support smooth exit animation
  React.useLayoutEffect(() => {
    if (ref.current && (phase === 'idle' || phase === 'entering' || phase === 'animating')) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.width > 0) {
        ref.current.style.setProperty('--ba-measured-width', `${rect.width}px`);
      }
    }
  }, [value, phase]);

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== e.currentTarget) return;

      // symbol-exit controls the width animation - use it to trigger removal
      if (e.animationName.includes('symbol-exit')) {
        onPhaseComplete(id, 'exited');
      } else if (e.animationName.includes('fade-in')) {
        onPhaseComplete(id, phase === 'animating' ? 'completed' : 'entered');
      }
    },
    [onPhaseComplete, id, phase],
  );

  // Render ZWSP when hidden for consistent DOM structure
  if ((phase as string) === 'exited') {
    return (
      <span className='ba-symbol-slot-hidden'>
        <ZeroWidthSpace />
      </span>
    );
  }

  // Cross-fade mode: render both old and new values overlapping
  if (phase === 'animating' && fromValue) {
    return (
      <span
        ref={ref}
        className='ba-symbol-slot ba-symbol-slot-crossfade'
        data-phase={phase}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Old value fading out - absolute positioned */}
        <span className='ba-symbol-slot-from'>{fromValue}</span>
        {/* New value fading in - provides natural width */}
        <span className='ba-symbol-slot-to'>{value}</span>
      </span>
    );
  }

  return (
    <span ref={ref} className='ba-symbol-slot' data-phase={phase} onAnimationEnd={handleAnimationEnd}>
      <span className='ba-symbol-slot-inner'>{value}</span>
    </span>
  );
}

export const SymbolSlot = React.memo(SymbolSlotComponent);
SymbolSlot.displayName = 'SymbolSlot';
