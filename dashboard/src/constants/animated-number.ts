export const DIGIT_WIDTH = '0.65em';
export const MASK_HEIGHT = '0.15em';
export const MASK_WIDTH = '1.3em'; // 2x DIGIT_WIDTH for fade zone

export const ZWSP = '\u200B';
export const SPRING_EASING = 'cubic-bezier(0.17, 1.10, 0.3, 1)';

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
    padding: `calc(${MASK_HEIGHT} / 2) ${MASK_WIDTH}`,
    maskImage: `linear-gradient(to right, transparent 0, #000 ${MASK_WIDTH}, #000 calc(100% - ${MASK_WIDTH}), transparent)`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}

/** Vertical fade gradient for digit roll animations. */
export function getDigitMaskStyles(): React.CSSProperties {
  return {
    height: `calc(1lh + ${MASK_HEIGHT})`,
    overflow: 'clip',
    padding: `calc(${MASK_HEIGHT} / 2) 0`,
    margin: `calc(-1 * ${MASK_HEIGHT} / 2) 0`,
    maskImage: `linear-gradient(to bottom, 
      transparent 0, 
      #000 ${MASK_HEIGHT}, 
      #000 calc(100% - ${MASK_HEIGHT}), 
      transparent 100%
    )`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}
