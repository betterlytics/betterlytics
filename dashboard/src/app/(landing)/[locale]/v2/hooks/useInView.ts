import { useInView as useMotionInView, type UseInViewOptions } from 'motion/react';
import type { RefObject } from 'react';

/**
 * When the page's scroll-driven effects fire, as named presets rather than a
 * threshold per component. Every trigger line sits where any element on the page
 * can reach it, even the last one on a tall screen.
 */
const PRESETS = {
  /** Entrances: once, as the element's top edge clears the bottom of the viewport. */
  enter: { once: true, amount: 0.15, margin: '0px 0px -6% 0px' },
  /** Frames and rules drawn on arrival: once, a fifth of the way up the viewport, so the pen moves while the reader is there. */
  draw: { once: true, amount: 0, margin: '0px 0px -22% 0px' },
  /** Headline ink: once half the line is a third of the way up, while it is being read rather than before it arrives. */
  read: { once: true, amount: 0.5, margin: '0px 0px -34% 0px' },
  /** Deferred loading: once, when the element comes within half a screen of the viewport. */
  near: { once: true, amount: 0, margin: '0px 0px 50% 0px' },
  /** Looping work: true only while some of the element is on screen, false again once it leaves. */
  onScreen: { once: false, amount: 'some' },
} satisfies Record<string, UseInViewOptions>;

export type InViewPreset = keyof typeof PRESETS;

/** Whether the element has entered (or, for `onScreen`, is on) the screen, per the preset's trigger. */
export function useInView(ref: RefObject<Element | null>, preset: InViewPreset = 'enter') {
  return useMotionInView(ref, PRESETS[preset]);
}
