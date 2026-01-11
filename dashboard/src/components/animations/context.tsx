'use client';

import { createContext, useContext, useReducer, useLayoutEffect, useRef, useMemo } from 'react';
import type { Digit } from '@/constants/animated-number';

export type DigitPhase = 'idle' | 'animating' | 'entering' | 'exiting';

export type DigitState = {
  id: string;
  digit: Digit;
  phase: DigitPhase;
  fromDigit: Digit | null;
};

export type AnimatedNumberState = {
  digits: DigitState[];
};

type AnimatedNumberActionType = 'changed' | 'completed' | 'exited' | 'entered' | 'sync';

type AnimatedNumberActionBase<T extends AnimatedNumberActionType> = {
  type: T;
  id: string;
};

type AnimatedNumberAction =
  | AnimatedNumberActionBase<'changed'> & { fromDigit: Digit; toDigit: Digit }
  | AnimatedNumberActionBase<'completed'>
  | AnimatedNumberActionBase<'exited'>
  | AnimatedNumberActionBase<'entered'>
  | { type: 'sync'; digits: DigitState[] };

type AnimatedNumberContextValue = {
  state: AnimatedNumberState;
  dispatch: React.Dispatch<AnimatedNumberAction>;
  duration: number;
};

export const AnimatedNumberContext = createContext<AnimatedNumberContextValue | null>(null);

export function useAnimatedNumber(): AnimatedNumberContextValue {
  const ctx = useContext(AnimatedNumberContext);
  if (!ctx) {
    throw new Error('useAnimatedNumber must be used within AnimatedNumberProvider');
  }
  return ctx;
}

function animatedNumberReducer(
  state: AnimatedNumberState,
  action: AnimatedNumberAction
): AnimatedNumberState {
  switch (action.type) {
    case 'changed':
      return {
        digits: state.digits.map(d =>
          d.id === action.id
            ? { ...d, digit: action.toDigit, phase: 'animating' as const, fromDigit: action.fromDigit }
            : d
        ),
      };

    case 'completed':
      return {
        digits: state.digits.map(d =>
          d.id === action.id
            ? { ...d, phase: 'idle' as const, fromDigit: null }
            : d
        ),
      };

    case 'exited':
      return {
        digits: state.digits.filter(d => d.id !== action.id),
      };

    case 'entered':
      return {
        digits: state.digits.map(d =>
          d.id === action.id
            ? { ...d, phase: 'idle' as const }
            : d
        ),
      };

    case 'sync':
      return {
        digits: action.digits,
      };

    default:
      return state;
  }
}

function createInitialDigits(value: number): DigitState[] {
  return String(Math.abs(Math.floor(value)))
    .split('')
    .map(Number)
    .map(digit => ({
      id: crypto.randomUUID(),
      digit: digit as Digit,
      phase: 'idle' as const,
      fromDigit: null,
    }));
}

type AnimatedNumberProviderProps = {
  value: number;
  duration: number;
  children: React.ReactNode;
};

/**
 * Provider that manages digit state and animations.
 */
export function AnimatedNumberProvider({ value, duration, children }: AnimatedNumberProviderProps) {
  const [state, dispatch] = useReducer(
    animatedNumberReducer,
    value,
    (initialValue) => ({ digits: createInitialDigits(initialValue) })
  );

  const prevValueRef = useRef(value);

  // Handle value changes - useLayoutEffect ensures state change happens before paint
  useLayoutEffect(() => {
    if (value !== prevValueRef.current) {
      const newDigitValues = String(Math.abs(Math.floor(value)))
        .split('')
        .map(Number) as Digit[];

      // Filter out any already-exiting digits for accurate count
      const activeDigits = state.digits.filter(d => d.phase !== 'exiting');
      const prevDigitCount = activeDigits.length;
      const newDigitCount = newDigitValues.length;

      if (newDigitCount !== prevDigitCount) {
        // Digit count changed - map from RIGHT (least significant)
        const newDigits: DigitState[] = [];
        const isExpanding = newDigitCount > prevDigitCount;
        const isShrinking = newDigitCount < prevDigitCount;
        
        if (isExpanding) {
          // EXPANDING: Add new digits on the left
          for (let i = 0; i < newDigitCount; i++) {
            const digit = newDigitValues[i];
            const oldIndex = i - (newDigitCount - prevDigitCount);
            const existing = oldIndex >= 0 ? activeDigits[oldIndex] : null;
            
            if (existing) {
              if (existing.digit !== digit) {
                newDigits.push({ ...existing, digit, phase: 'animating', fromDigit: existing.digit });
              } else {
                newDigits.push(existing);
              }
            } else {
              // New entering digit - roll from 0 to target
              newDigits.push({
                id: crypto.randomUUID(),
                digit,
                phase: 'entering',
                fromDigit: 0 as Digit,
              });
            }
          }
        } else if (isShrinking) {
          // SHRINKING: Mark leftmost digits as exiting, update remaining
          const exitCount = prevDigitCount - newDigitCount;
          
          // First, add exiting digits (they roll to 0 while width shrinks)
          for (let i = 0; i < exitCount; i++) {
            const existing = activeDigits[i];
            newDigits.push({
              ...existing,
              phase: 'exiting',
            });
          }
          
          // Then, add/update remaining digits
          for (let i = 0; i < newDigitCount; i++) {
            const digit = newDigitValues[i];
            const oldIndex = i + exitCount;
            const existing = activeDigits[oldIndex];
            
            if (existing) {
              if (existing.digit !== digit) {
                newDigits.push({ ...existing, digit, phase: 'animating', fromDigit: existing.digit });
              } else {
                newDigits.push(existing);
              }
            }
          }
        }
        
        dispatch({ type: 'sync', digits: newDigits });
      } else {
        // Same digit count - dispatch changes for each changed digit
        newDigitValues.forEach((newDigit, index) => {
          const prevState = activeDigits[index];
          if (prevState && prevState.digit !== newDigit) {
            dispatch({
              type: 'changed',
              id: prevState.id,
              fromDigit: prevState.digit,
              toDigit: newDigit,
            });
          }
        });
      }

      prevValueRef.current = value;
    }
  }, [value, state.digits]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    duration,
  }), [state, dispatch, duration]);

  return (
    <AnimatedNumberContext.Provider value={contextValue}>
      {children}
    </AnimatedNumberContext.Provider>
  );
}
