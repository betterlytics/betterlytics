import { useInView as useMotionInView, type UseInViewOptions } from 'motion/react';
import type { RefObject } from 'react';

/**
 * Trigger lines must stay reachable by any element, even the last on a tall screen.
 * `draw` and `read` fire well up the viewport so they play while the reader is there.
 */
const PRESETS = {
  enter: { once: true, amount: 0.15, margin: '0px 0px -6% 0px' },
  draw: { once: true, amount: 0, margin: '0px 0px -22% 0px' },
  read: { once: true, amount: 0.5, margin: '0px 0px -34% 0px' },
  near: { once: true, amount: 0, margin: '0px 0px 50% 0px' },
  onScreen: { once: false, amount: 'some' },
} satisfies Record<string, UseInViewOptions>;

type InViewPreset = keyof typeof PRESETS;

export function useInView(ref: RefObject<Element | null>, preset: InViewPreset = 'enter') {
  return useMotionInView(ref, PRESETS[preset]);
}
