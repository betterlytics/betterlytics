'use client';

import { DIGITS, type Digit, type DigitPhase } from './tokens';

const DIGIT_SPANS = DIGITS.map((d) => (
  <span key={d} className='ba-digit-reel-digit'>
    {d}
  </span>
));

const OFFSET_CLASSES: Record<Digit, string> = {
  0: 'ba-offset-0',
  1: 'ba-offset-1',
  2: 'ba-offset-2',
  3: 'ba-offset-3',
  4: 'ba-offset-4',
  5: 'ba-offset-5',
  6: 'ba-offset-6',
  7: 'ba-offset-7',
  8: 'ba-offset-8',
  9: 'ba-offset-9',
};

type DigitReelProps = {
  digit: Digit;
  phase: DigitPhase;
};

export function DigitReel({ digit, phase }: DigitReelProps) {
  return (
    <span className='ba-digit-reel-wrapper' data-phase={phase}>
      <span className='ba-digit-reel-mask'>
        <span className={`ba-digit-reel-inner ${OFFSET_CLASSES[digit]}`} data-phase={phase}>
          {DIGIT_SPANS}
        </span>
      </span>
    </span>
  );
}
