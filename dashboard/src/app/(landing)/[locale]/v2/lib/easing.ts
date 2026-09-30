/* Easing curves for motion (JS) transitions. CSS reads the theme's easing tokens instead. */

/** The page's ease-out, the same curve as the `--ease-out-expo` token in landing.css. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * The headline underline's stroke: slow to set down, quick through the middle and
 * slow again as it lifts off, like a pen stroke. Not the `--ease-pen` token, which is
 * the frames' and walls' draw-in.
 */
export const EASE_INK = [0.5, 0, 0.2, 1] as const;
