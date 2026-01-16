'use client';

import { createContext, useContext, useReducer, useLayoutEffect, useRef, useMemo } from 'react';

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = (typeof DIGITS)[number];

export type DigitPhase = 'idle' | 'animating' | 'entering' | 'exiting';

export type DigitState = {
  id: string;
  digit: Digit;
  phase: DigitPhase;
  fromDigit: Digit | null;
};

export type NumberRollState = {
  digits: DigitState[];
};

type NumberRollActionType = 'changed' | 'completed' | 'exited' | 'entered' | 'sync';

type NumberRollActionBase<T extends NumberRollActionType> = {
  type: T;
  id: string;
};

type NumberRollAction =
  | (NumberRollActionBase<'changed'> & { fromDigit: Digit; toDigit: Digit })
  | NumberRollActionBase<'completed'>
  | NumberRollActionBase<'exited'>
  | NumberRollActionBase<'entered'>
  | { type: 'sync'; digits: DigitState[] };

type NumberRollConfigValue = {
  dispatch: React.Dispatch<NumberRollAction>;
  duration: number;
};

type NumberRollStateValue = {
  state: NumberRollState;
};

export const NumberRollConfigContext = createContext<NumberRollConfigValue | null>(null);
export const NumberRollStateContext = createContext<NumberRollStateValue | null>(null);

export function useAnimatedConfig(): NumberRollConfigValue {
  const ctx = useContext(NumberRollConfigContext);
  if (!ctx) {
    throw new Error('useAnimatedConfig must be used within NumberRollProvider');
  }
  return ctx;
}

export function useAnimatedState(): NumberRollStateValue {
  const ctx = useContext(NumberRollStateContext);
  if (!ctx) {
    throw new Error('useAnimatedState must be used within NumberRollProvider');
  }
  return ctx;
}

function numberRollReducer(state: NumberRollState, action: NumberRollAction): NumberRollState {
  const updateDigits = (id: string, transform: (d: DigitState) => DigitState) => ({
    digits: state.digits.map((d) => (d.id === id ? transform(d) : d)),
  });

  switch (action.type) {
    case 'changed':
      return updateDigits(action.id, (d) => ({
        ...d,
        digit: action.toDigit,
        phase: d.phase === 'entering' ? 'entering' : 'animating',
        fromDigit: action.fromDigit,
      }));

    case 'completed':
      return updateDigits(action.id, (d) => ({ ...d, phase: 'idle', fromDigit: null }));

    case 'entered':
      return updateDigits(action.id, (d) => ({ ...d, phase: 'idle' }));

    case 'exited':
      return {
        digits: state.digits.filter((d) => d.id !== action.id),
      };

    case 'sync':
      return {
        digits: action.digits,
      };

    default:
      return state;
  }
}

function parseDigits(value: number): Digit[] {
  return String(Math.abs(Math.floor(value)))
    .split('')
    .map(Number) as Digit[];
}

function createInitialDigits(value: number): DigitState[] {
  return parseDigits(value).map((digit) => ({
    id: crypto.randomUUID(),
    digit,
    phase: 'idle' as const,
    fromDigit: null,
  }));
}

type NumberRollProviderProps = {
  value: number;
  duration: number;
  children: React.ReactNode;
};

function diffDigits(prev: DigitState[], nextValues: Digit[]): DigitState[] {
  const result: DigitState[] = [];

  const prevLen = prev.length;
  const nextLen = nextValues.length;
  const max = Math.max(prevLen, nextLen);

  for (let i = 0; i < max; i++) {
    const prevDigit = prev[prevLen - 1 - i];
    const nextValue = nextValues[nextLen - 1 - i];

    if (!prevDigit && nextValue !== undefined) {
      result.unshift({
        id: crypto.randomUUID(),
        digit: nextValue,
        phase: 'entering',
        fromDigit: 0,
      });
      continue;
    }

    if (prevDigit && nextValue === undefined) {
      result.unshift({
        ...prevDigit,
        phase: 'exiting',
      });
      continue;
    }

    if (!prevDigit || nextValue === undefined) continue;

    if (prevDigit.digit !== nextValue) {
      result.unshift({
        ...prevDigit,
        digit: nextValue,
        phase: 'animating',
        fromDigit: prevDigit.digit,
      });
    } else {
      if (prevDigit.phase === 'exiting') {
        result.unshift({
          ...prevDigit,
          phase: 'entering',
        });
      } else {
        result.unshift(prevDigit);
      }
    }
  }

  return result;
}

/**
 * Provider that manages digit state and animations.
 */
export function NumberRollProvider({ value, duration, children }: NumberRollProviderProps) {
  const [state, dispatch] = useReducer(numberRollReducer, value, (initialValue) => ({
    digits: createInitialDigits(initialValue),
  }));

  const prevValueRef = useRef(value);

  useLayoutEffect(() => {
    if (value === prevValueRef.current) return;

    dispatch({ type: 'sync', digits: diffDigits(state.digits, parseDigits(value)) });
    prevValueRef.current = value;
  }, [value, state.digits]);

  const configValue = useMemo(() => ({ dispatch, duration }), [dispatch, duration]);
  const stateValue = useMemo(() => ({ state }), [state]);

  return (
    <NumberRollConfigContext.Provider value={configValue}>
      <NumberRollStateContext.Provider value={stateValue}>{children}</NumberRollStateContext.Provider>
    </NumberRollConfigContext.Provider>
  );
}
