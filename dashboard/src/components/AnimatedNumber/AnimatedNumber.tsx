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
}

export function AnimatedNumber({
  value,
  className,
  duration = 600,
  easing = 'spring',
}: AnimatedNumberProps) {
  const prevValueRef = useRef<number | null>(null);
  const [digitStates, setDigitStates] = useState<DigitState[]>([]);

  const removeExitingDigit = useCallback((posFromRight: number) => {
    setDigitStates((prev) => prev.filter((d) => d.positionFromRight !== posFromRight));
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
    const maxPosFromRight = Math.max(
      newDigits.length - 1,
      oldDigits ? oldDigits.length - 1 : 0
    );

    // Process all positions (including ones that will exit)
    for (let posFromRight = maxPosFromRight; posFromRight >= 0; posFromRight--) {
      const newIndex = newDigits.length - 1 - posFromRight;
      const oldIndex = oldDigits ? oldDigits.length - 1 - posFromRight : -1;

      const hasNewDigit = newIndex >= 0 && newIndex < newDigits.length;
      const hasOldDigit = oldDigits && oldIndex >= 0 && oldIndex < oldDigits.length;

      if (hasNewDigit) {
        // Digit exists in new value
        newStates.push({
          digit: newDigits[newIndex],
          prevDigit: hasOldDigit ? oldDigits[oldIndex] : null,
          positionFromRight: posFromRight,
          isExiting: false,
        });
      } else if (hasOldDigit) {
        // Digit only exists in old value - it's exiting
        newStates.push({
          digit: oldDigits[oldIndex],
          prevDigit: oldDigits[oldIndex],
          positionFromRight: posFromRight,
          isExiting: true,
        });
      }
    }

    setDigitStates(newStates);
    prevValueRef.current = value;
  }, [value]);

  return (
    <span
      className={cn(
        'inline-flex tabular-nums',
        className
      )}
      style={{ lineHeight: 1 }}
    >
      {digitStates.map((state) => (
        <AnimatedDigit
          key={`pos-${state.positionFromRight}`}
          digit={state.digit}
          prevDigit={state.prevDigit}
          duration={duration}
          easing={easing}
          isExiting={state.isExiting}
          onExitComplete={() => removeExitingDigit(state.positionFromRight)}
        />
      ))}
    </span>
  );
}


