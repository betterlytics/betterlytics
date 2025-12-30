'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedDigit } from './AnimatedDigit';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  easing?: 'spring' | 'ease-out' | 'linear';
}

interface DigitState {
  digit: number;
  prevDigit: number | null;
  positionFromRight: number;
  isExiting?: boolean;
  id: string; // Unique ID for each digit instance
}

let instanceCounter = 0;
function generateId() {
  return `digit-${++instanceCounter}`;
}

export function AnimatedNumber({
  value,
  className,
  duration = 1800,
  easing = 'spring',
}: AnimatedNumberProps) {
  const prevValueRef = useRef<number | null>(null);
  const [digitStates, setDigitStates] = useState<DigitState[]>([]);
  const digitMapRef = useRef<Map<number, DigitState>>(new Map());

  const removeExitingDigit = useCallback((id: string) => {
    setDigitStates((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => {
    const newDigits = String(Math.abs(Math.floor(value)))
      .split('')
      .map(Number);

    const oldDigits = prevValueRef.current !== null
      ? String(Math.abs(Math.floor(prevValueRef.current)))
          .split('')
          .map(Number)
      : null;

    const newStates: DigitState[] = [];
    const newDigitMap = new Map<number, DigitState>();
    const maxPosFromRight = Math.max(
      newDigits.length - 1,
      oldDigits ? oldDigits.length - 1 : 0
    );

    // Process all positions
    for (let posFromRight = maxPosFromRight; posFromRight >= 0; posFromRight--) {
      const newIndex = newDigits.length - 1 - posFromRight;
      const oldIndex = oldDigits ? oldDigits.length - 1 - posFromRight : -1;

      const hasNewDigit = newIndex >= 0 && newIndex < newDigits.length;
      const hasOldDigit = oldDigits && oldIndex >= 0 && oldIndex < oldDigits.length;

      // Get existing state for this position
      const existingState = digitMapRef.current.get(posFromRight);

      if (hasNewDigit) {
        // Reuse existing component at this position if it's not exiting
        const id = existingState && !existingState.isExiting 
          ? existingState.id 
          : generateId();
        
        const state: DigitState = {
          digit: newDigits[newIndex],
          prevDigit: hasOldDigit ? oldDigits[oldIndex] : null,
          positionFromRight: posFromRight,
          isExiting: false,
          id,
        };
        newStates.push(state);
        newDigitMap.set(posFromRight, state);
      } else if (hasOldDigit && existingState) {
        // Digit is exiting - keep the same ID so component continues animation
        const state: DigitState = {
          digit: oldDigits[oldIndex],
          prevDigit: oldDigits[oldIndex],
          positionFromRight: posFromRight,
          isExiting: true,
          id: existingState.id,
        };
        newStates.push(state);
        // Don't add to newDigitMap - this position is exiting
      }
    }

    digitMapRef.current = newDigitMap;
    setDigitStates(newStates);
    prevValueRef.current = value;
  }, [value]);

  // Mask styles matching motion.dev approach
  // The mask creates soft fade edges on all sides for smooth enter/exit
  const maskStyle: React.CSSProperties = {
    display: 'inline-flex',
    margin: '0 calc(-1 * var(--mask-width, 0.5em))',
    padding: 'calc(var(--mask-height, 0.15em) / 2) var(--mask-width, 0.5em)',
    position: 'relative',
    zIndex: -1, // Allow mask to go under neighboring elements
    overflow: 'clip',
    // Complex mask with gradients for smooth fade edges
    maskImage: `
      linear-gradient(to right, transparent 0, #000 calc(var(--mask-width, 0.5em) / var(--invert-x, 1)), #000 calc(100% - calc(var(--mask-width, 0.5em) / var(--invert-x, 1))), transparent),
      linear-gradient(to bottom, transparent 0, #000 var(--mask-height, 0.15em), #000 calc(100% - var(--mask-height, 0.15em)), transparent 100%),
      radial-gradient(at bottom right, #000 0, transparent 71%),
      radial-gradient(at bottom left, #000 0, transparent 71%),
      radial-gradient(at top left, #000 0, transparent 71%),
      radial-gradient(at top right, #000 0, transparent 71%)
    `.replace(/\n\s*/g, ''),
    maskSize: `
      100% calc(100% - var(--mask-height, 0.15em) * 2),
      calc(100% - calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) * 2) 100%,
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.15em),
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.15em),
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.15em),
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.15em)
    `.replace(/\n\s*/g, ''),
    maskPosition: 'center center, center center, left top, right top, right bottom, left bottom',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;

  return (
    <span
      className={cn(
        'inline-flex tabular-nums',
        className
      )}
      aria-label={value.toString()}
      style={{ 
        lineHeight: 1,
        isolation: 'isolate', // Create stacking context for z-index mask
        whiteSpace: 'nowrap',
        // CSS variable for mask calculations
        ['--invert-x' as string]: 1,
      }}
    >
      {/* Mask container with gradient fade edges */}
      <span aria-hidden="true" style={maskStyle}>
        {/* Inner flex container for digits */}
        <span 
          className="number-section-integer"
          style={{ display: 'inline-flex', justifyContent: 'right' }}
        >
          {digitStates.map((state) => (
            <AnimatedDigit
              key={state.id}
              digit={state.digit}
              prevDigit={state.prevDigit}
              duration={duration}
              easing={easing}
              isExiting={state.isExiting}
              onExitComplete={() => removeExitingDigit(state.id)}
            />
          ))}
        </span>
      </span>
    </span>
  );
}



