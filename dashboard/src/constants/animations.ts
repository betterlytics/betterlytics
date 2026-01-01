// Animation sizing constants shared between AnimatedNumber and DigitReel
export const DIGIT_WIDTH = '0.65em';
export const MASK_HEIGHT = '0.3em';
export const MASK_WIDTH = '0.5em';

// Zero-width space for maintaining proper inline-flex sizing
export const ZWSP = '\u200B';

// Easing functions
export const SPRING_EASING = 'cubic-bezier(0.17, 1.15, 0.3, 1)';
export const ENTER_EXIT_EASING = 'ease-out';

/**
 * Creates mask styles for the fade gradient effect on AnimatedNumber.
 * The mask creates soft edges that fade digits in/out during enter/exit animations.
 */
export function getMaskStyles(): React.CSSProperties {
  return {
    display: 'inline-flex',
    position: 'relative',
    zIndex: -1,
    overflow: 'clip',
    margin: `0 calc(-1 * ${MASK_WIDTH})`,
    padding: `calc(${MASK_HEIGHT} / 2) ${MASK_WIDTH}`,
    maskImage: [
      `linear-gradient(to right, transparent 0, #000 ${MASK_WIDTH}, #000 calc(100% - ${MASK_WIDTH}), transparent)`,
      `linear-gradient(to bottom, transparent 0, #000 ${MASK_HEIGHT}, #000 calc(100% - ${MASK_HEIGHT}), transparent 100%)`,
      'radial-gradient(at bottom right, #000 0, transparent 70%)',
      'radial-gradient(at bottom left, #000 0, transparent 70%)',
      'radial-gradient(at top left, #000 0, transparent 70%)',
      'radial-gradient(at top right, #000 0, transparent 70%)',
    ].join(','),
    maskSize: [
      `100% calc(100% - ${MASK_HEIGHT} * 2)`,
      `calc(100% - ${MASK_WIDTH} * 2) 100%`,
      `${MASK_WIDTH} ${MASK_HEIGHT}`,
      `${MASK_WIDTH} ${MASK_HEIGHT}`,
      `${MASK_WIDTH} ${MASK_HEIGHT}`,
      `${MASK_WIDTH} ${MASK_HEIGHT}`,
    ].join(','),
    maskPosition: 'center center, center center, left top, right top, right bottom, left bottom',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
}
