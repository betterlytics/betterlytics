/**
 * Contract between the journey section and its illustrations. Any renderer
 * (CSS, canvas, three.js) that honours these two flags can stand in a card.
 * An illustration styled in CSS puts them on its own root as `data-in` and
 * `data-live` for its stylesheet to key on.
 */
export type IllustrationProps = {
  /** The card has scrolled into view at least once. Draw-in effects run from here and never rewind. */
  entered: boolean;
  /** The card is the active one. Looping animations run only while this is true. */
  live: boolean;
};
