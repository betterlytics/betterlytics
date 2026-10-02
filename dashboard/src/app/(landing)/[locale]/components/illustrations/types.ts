/** CSS-styled illustrations mirror these on their root as `data-in` / `data-live`. */
export type IllustrationProps = {
  /** Scrolled into view at least once; draw-ins never rewind. */
  entered: boolean;
  /** Active card with the stack on screen; loops run only while true. */
  live: boolean;
};
