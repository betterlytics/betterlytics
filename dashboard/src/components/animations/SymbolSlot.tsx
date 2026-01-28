'use client';

import { forwardRef } from 'react';

export type SymbolPhase = 'idle' | 'entering' | 'exiting' | 'animating';

type SymbolSlotProps = {
  value: string;
  phase: SymbolPhase;
  fromValue?: string;
};

export const SymbolSlot = forwardRef<HTMLSpanElement, SymbolSlotProps>(
  function SymbolSlot({ value, phase, fromValue }, ref) {
    if (phase === 'exiting') {
      return (
        <span ref={ref} className='ba-symbol-slot' data-phase={phase}>
          <span className='ba-symbol-slot-inner'>{value}</span>
        </span>
      );
    }

    if (phase === 'animating' && fromValue) {
      return (
        <span ref={ref} className='ba-symbol-slot ba-symbol-slot-crossfade' data-phase={phase}>
          <span className='ba-symbol-slot-from'>{fromValue}</span>
          <span className='ba-symbol-slot-to'>{value}</span>
        </span>
      );
    }

    return (
      <span ref={ref} className='ba-symbol-slot' data-phase={phase}>
        <span className='ba-symbol-slot-inner'>{value}</span>
      </span>
    );
  }
);
