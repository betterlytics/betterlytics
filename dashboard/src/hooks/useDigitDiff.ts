'use client';

import type { Digit, DigitState } from '@/constants/animated-number';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

type UseDigitDiffOptions = {
  value: number;
};

type UseDigitDiffResult = {
  digitStates: DigitState[];
  setDigitStates: React.Dispatch<React.SetStateAction<DigitState[]>>;
};

/**
 * Manages digit state diffing for AnimatedNumber.
 * Tracks value changes and computes entering/exiting states.
 */
export function useDigitDiff({ value }: UseDigitDiffOptions): UseDigitDiffResult {
  const componentId = useId();
  const prevValueRef = useRef<number | null>(null);
  const digitMapRef = useRef<Map<number, DigitState>>(new Map());
  const digitIdCounter = useRef(0);

  const [digitStates, setDigitStates] = useState<DigitState[]>([]);

  const generateId = useCallback(() => {
    return `${componentId}-digit-${++digitIdCounter.current}`;
  }, [componentId]);

  useLayoutEffect(() => {
    const nextDigits = String(Math.abs(Math.floor(value)))
      .split('')
      .map(Number) as Digit[];

    const prevDigits = prevValueRef.current !== null
      ? String(Math.abs(Math.floor(prevValueRef.current)))
          .split('')
          .map(Number) as Digit[]
      : null;

    const { states, stateMap } = diffDigits({
      nextDigits,
      prevDigits,
      prevStateMap: digitMapRef.current,
      generateId,
    });

    digitMapRef.current = stateMap;
    setDigitStates(states);
    prevValueRef.current = value;
  }, [value, generateId]);

  return { digitStates, setDigitStates };
}

type DiffInput = {
  nextDigits: Digit[];
  prevDigits: Digit[] | null;
  prevStateMap: Map<number, DigitState>;
  generateId: () => string;
};

type DiffOutput = {
  states: DigitState[];
  stateMap: Map<number, DigitState>;
};

function diffDigits(input: DiffInput): DiffOutput {
  const { nextDigits, prevDigits, prevStateMap, generateId } = input;

  const states: DigitState[] = [];
  const stateMap = new Map<number, DigitState>();

  const maxPosFromRight = Math.max(
    nextDigits.length - 1,
    prevDigits ? prevDigits.length - 1 : 0
  );

  for (let posFromRight = maxPosFromRight; posFromRight >= 0; posFromRight--) {
    const newIndex = nextDigits.length - 1 - posFromRight;
    const oldIndex = prevDigits ? prevDigits.length - 1 - posFromRight : -1;

    const hasNewDigit = newIndex >= 0 && newIndex < nextDigits.length;
    const hasOldDigit = prevDigits && oldIndex >= 0 && oldIndex < prevDigits.length;

    const existingState = prevStateMap.get(posFromRight);

    if (hasNewDigit) {
      const id = existingState ? existingState.id : generateId();
      const isNewlyEntering = !existingState && !hasOldDigit;

      const state: DigitState = {
        digit: nextDigits[newIndex],
        prevDigit: hasOldDigit ? prevDigits[oldIndex] : (existingState?.digit ?? null),
        lifecycle: isNewlyEntering ? 'entering' : 'idle',
        id,
      };
      states.push(state);
      stateMap.set(posFromRight, state);
    } else if (hasOldDigit && existingState) {
      states.push({
        ...existingState,
        digit: prevDigits[oldIndex],
        prevDigit: prevDigits[oldIndex],
        lifecycle: 'exiting',
      });
    }
  }

  return { states, stateMap };
}
