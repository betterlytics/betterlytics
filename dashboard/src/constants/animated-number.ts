export const DIGIT_WIDTH = '0.65em';
export const MASK_WIDTH = '2em'; // Horizontal fade zone - doubled to allow full flyout visibility
export const MASK_BLEED = '0.4em'; // Vertical bleed into neighbors for digit roll

export const ZWSP = '\u200B';
export const SPRING_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

// Go to 20% immediately since its invisible initially
export const OPACITY_EASING = 'linear(0, 0.2 2%, 0.4 20%, 0.75 40%, 0.9 55%, 1)';

export const LAYOUT_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)'; // Smooth easing without overshoot for width changes

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = typeof DIGITS[number];

/** Horizontal fade gradient for enter/exit animations. */
export function getMaskStyles(): React.CSSProperties {
  return {
    display: 'inline-flex',
    position: 'relative',
    zIndex: -1,
    overflow: 'clip',
    pointerEvents: 'none',
    margin: `0 calc(-1 * ${MASK_WIDTH})`,
    padding: `0 ${MASK_WIDTH}`,
    maskImage: `linear-gradient(to right, transparent 0, #000 ${MASK_WIDTH}, #000 calc(100% - ${MASK_WIDTH}), transparent)`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}

/** Vertical fade gradient for digit roll - bleeds into neighbors. */
export function getDigitMaskStyles(): React.CSSProperties {
  return {
    height: `calc(1lh + ${MASK_BLEED})`,
    overflow: 'clip',
    padding: `calc(${MASK_BLEED} / 2) 0`,
    margin: `calc(-1 * ${MASK_BLEED} / 2) 0`,
    maskImage: `linear-gradient(to bottom, 
      transparent 0, 
      #000 ${MASK_BLEED}, 
      #000 calc(100% - ${MASK_BLEED}), 
      transparent 100%
    )`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}
