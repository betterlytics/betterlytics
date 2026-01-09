export const DIGIT_WIDTH = '0.65em';
export const MASK_HEIGHT = '0.2em';
export const MASK_WIDTH = '0.5em';

export const ZWSP = '\u200B';

export const SPRING_EASING = 'cubic-bezier(0.17, 1.10, 0.3, 1)';

export const ENTER_TRANSFORM_OFFSET = '-0.33';
export const ENTER_SCALE = '1.02';

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = typeof DIGITS[number];

export type DigitLifecycle = 'idle' | 'entering' | 'exiting' | 'done';
export type ReelMotion = 'wheel' | 'shortest-path';

/** State for a single digit position in AnimatedNumber */
export type DigitState = {
  id: string;
  digit: Digit;
  prevDigit: Digit | null;
  lifecycle: DigitLifecycle;
};

/**
 * Creates mask styles for horizontal fade gradient (enter/exit animations).
 * Only fades left/right edges.
 */
export function getMaskStyles(): React.CSSProperties {
  return {
    display: 'inline-flex',
    position: 'relative',
    zIndex: -1,
    overflow: 'clip',
    margin: `0 calc(-1 * ${MASK_WIDTH})`,
    padding: `calc(${MASK_HEIGHT} / 2) ${MASK_WIDTH}`,
    maskImage: `linear-gradient(to right, transparent 0, #000 ${MASK_WIDTH}, #000 calc(100% - ${MASK_WIDTH}), transparent)`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}

/**
 * Creates mask styles for vertical fade gradient (digit roll animations).
 * Constrains container to 1 digit height with gradient fade at edges.
 */
export function getDigitMaskStyles(): React.CSSProperties {
  const fadeHeight = MASK_HEIGHT;
  
  return {
    // CRITICAL: Fixed height for 1 digit, with overflow clip
    height: `calc(1lh + ${fadeHeight})`, // 1lh = line-height-based unit
    overflow: 'clip',
    padding: `calc(${fadeHeight} / 2) 0`,
    margin: `calc(-1 * ${fadeHeight} / 2) 0`,
    // Gradient: fully opaque in center, fades at top/bottom edges
    maskImage: `linear-gradient(to bottom, 
      transparent 0, 
      #000 ${fadeHeight}, 
      #000 calc(100% - ${fadeHeight}), 
      transparent 100%
    )`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}


