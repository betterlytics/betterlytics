import type { Digit } from '@/constants/animated-number';
import type { AnimatedNumberState, AnimatedNumberAction, DigitState } from './types';

export function animatedNumberReducer(
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

/**
 * Creates initial digit states from a number value.
 */
export function createInitialDigits(value: number): DigitState[] {
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

/**
 * Computes actions needed to transition from current state to new value.
 * Returns the new digit states (for immediate state update).
 */
export function computeDigitChanges(
  prevDigits: DigitState[],
  newValue: number
): { newDigits: DigitState[]; actions: AnimatedNumberAction[] } {
  const newDigitValues = String(Math.abs(Math.floor(newValue)))
    .split('')
    .map(Number) as Digit[];

  const actions: AnimatedNumberAction[] = [];
  const newDigits: DigitState[] = [];

  for (let i = 0; i < newDigitValues.length; i++) {
    const newDigit = newDigitValues[i];
    const prevState = prevDigits[i];

    if (prevState) {
      if (prevState.digit !== newDigit) {
        // Digit changed
        actions.push({
          type: 'changed',
          id: prevState.id,
          fromDigit: prevState.digit,
          toDigit: newDigit,
        });
        newDigits.push({
          ...prevState,
          digit: newDigit,
          phase: 'animating',
          fromDigit: prevState.digit,
        });
      } else {
        // Unchanged
        newDigits.push(prevState);
      }
    } else {
      // New digit (Step 3: will be 'entering')
      const id = crypto.randomUUID();
      newDigits.push({
        id,
        digit: newDigit,
        phase: 'idle',
        fromDigit: null,
      });
    }
  }

  // Step 3: Handle removed digits (exiting)

  return { newDigits, actions };
}
