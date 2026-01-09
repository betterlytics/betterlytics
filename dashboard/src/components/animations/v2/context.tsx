'use client';

import { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';
import type { AnimatedNumberContextValue, AnimatedNumberState, AnimatedNumberAction, DigitState } from './types';
import type { Digit } from '@/constants/animated-number';

// ============================================================================
// Context
// ============================================================================

export const AnimatedNumberContext = createContext<AnimatedNumberContextValue | null>(null);

export function useAnimatedNumber(): AnimatedNumberContextValue {
  const ctx = useContext(AnimatedNumberContext);
  if (!ctx) {
    throw new Error('useAnimatedNumber must be used within AnimatedNumberProvider');
  }
  return ctx;
}

// ============================================================================
// Reducer
// ============================================================================

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
  const digitValues = String(Math.abs(Math.floor(value)))
    .split('')
    .map(Number) as Digit[];

  return digitValues.map(digit => ({
    id: crypto.randomUUID(),
    digit,
    phase: 'idle' as const,
    fromDigit: null,
  }));
}

// ============================================================================
// Provider
// ============================================================================

type AnimatedNumberProviderProps = {
  value: number;
  duration: number;
  children: React.ReactNode;
};

/**
 * Provider that manages digit state and animations.
 * Encapsulates all reducer logic and value change handling.
 */
export function AnimatedNumberProvider({ value, duration, children }: AnimatedNumberProviderProps) {
  const [state, dispatch] = useReducer(
    animatedNumberReducer,
    value,
    (initialValue) => ({ digits: createInitialDigits(initialValue) })
  );

  const prevValueRef = useRef(value);

  // Handle value changes
  useEffect(() => {
    if (value !== prevValueRef.current) {
      const newDigitValues = String(Math.abs(Math.floor(value)))
        .split('')
        .map(Number) as Digit[];

      const prevDigitCount = state.digits.length;
      const newDigitCount = newDigitValues.length;

      if (newDigitCount !== prevDigitCount) {
        // Digit count changed - map from RIGHT (least significant)
        const newDigits: DigitState[] = [];
        
        for (let i = 0; i < newDigitCount; i++) {
          const digit = newDigitValues[i];
          const oldIndex = i - (newDigitCount - prevDigitCount);
          const existing = oldIndex >= 0 ? state.digits[oldIndex] : null;
          
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
        
        dispatch({ type: 'sync', digits: newDigits });
      } else {
        // Same digit count - dispatch changes for each changed digit
        newDigitValues.forEach((newDigit, index) => {
          const prevState = state.digits[index];
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
