import type { Digit } from '@/constants/animated-number';

// Phases
export type DigitPhase = 'idle' | 'animating' | 'entering' | 'exiting';

// Per-digit state
export type DigitState = {
  id: string;
  digit: Digit;
  phase: DigitPhase;
  fromDigit: Digit | null;
};

// Root state
export type AnimatedNumberState = {
  digits: DigitState[];
};

// Action types
export type AnimatedNumberActionType = 'changed' | 'completed' | 'exited' | 'entered' | 'sync';

export type AnimatedNumberActionBase<T extends AnimatedNumberActionType> = {
  type: T;
  id: string;
};

export type AnimatedNumberAction =
  | AnimatedNumberActionBase<'changed'> & { fromDigit: Digit; toDigit: Digit }
  | AnimatedNumberActionBase<'completed'>
  | AnimatedNumberActionBase<'exited'>
  | AnimatedNumberActionBase<'entered'>
  | { type: 'sync'; digits: DigitState[] };

// Context value
export type AnimatedNumberContextValue = {
  state: AnimatedNumberState;
  dispatch: React.Dispatch<AnimatedNumberAction>;
  duration: number;
};
