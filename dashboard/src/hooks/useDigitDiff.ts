'use client';

import type { Digit } from '@/constants/animated-number';
import type { DigitState, DigitPhase } from '@/components/animations/v2/types';
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
 * Maps digits from RIGHT (least significant) for correct alignment.
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

/**
 * Pure function that diffs digits aligned from the RIGHT (least significant).
 * Returns new states and a position map for tracking across renders.
 */
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
      const nextDigit = nextDigits[newIndex];
      const prevDigit = hasOldDigit ? prevDigits[oldIndex] : null;
      const isNewlyEntering = !existingState && !hasOldDigit;

      if (isNewlyEntering) {
        // New digit entering from left - animate from 0
        const state: DigitState = {
          id: generateId(),
          digit: nextDigit,
          phase: 'entering',
          fromDigit: 0 as Digit,
        };
        states.push(state);
        stateMap.set(posFromRight, state);
      } else if (existingState && existingState.digit !== nextDigit) {
        // Digit value changed - animate
        const state: DigitState = {
          id: existingState.id,
          digit: nextDigit,
          phase: 'animating',
          fromDigit: existingState.digit,
        };
        states.push(state);
        stateMap.set(posFromRight, state);
      } else if (existingState) {
        // No change - preserve existing state exactly
        states.push(existingState);
        stateMap.set(posFromRight, existingState);
      } else {
        // First render - create idle state
        const state: DigitState = {
          id: generateId(),
          digit: nextDigit,
          phase: 'idle',
          fromDigit: null,
        };
        states.push(state);
        stateMap.set(posFromRight, state);
      }
    } else if (hasOldDigit && existingState) {
      // Digit exiting - animate to 0
      states.push({
        ...existingState,
        phase: 'exiting',
        fromDigit: existingState.digit,
      });
    }
  }

  return { states, stateMap };
}
