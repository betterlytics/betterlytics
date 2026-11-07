import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { getCoreWebVitalLevel } from '@/utils/coreWebVitals';

/* A made-up page loading on a phone. Times are ms into the load, on half-second frames so each lands under its frame. */

export const STEP = 500;
export const END = 4500;
/** INP runs from the tap at `INP` to the next paint at `PAINT`. */
export const AT = { TTFB: 500, FCP: 1500, LCP: 3000, CLS: 3500, INP: 4000, PAINT: 4180 } as const;
/** The rest of the text, the button and the image's reserved box paint between FCP and LCP. */
export const BODY = 1900;
export const SHIFT = 0.12;

/** `done` is when a metric's value is known, if later than when it starts. */
type Moment = { metric: CoreWebVitalName; at: number; value: number; done?: number };

export const MOMENTS: Moment[] = [
  { metric: 'TTFB', at: AT.TTFB, value: AT.TTFB },
  { metric: 'FCP', at: AT.FCP, value: AT.FCP },
  { metric: 'LCP', at: AT.LCP, value: AT.LCP },
  { metric: 'CLS', at: AT.CLS, value: SHIFT },
  { metric: 'INP', at: AT.INP, value: AT.PAINT - AT.INP, done: AT.PAINT },
];

/** Metrics that time a wait get a bar from its start to when the number is known. */
export const SPANS = [
  { metric: 'TTFB', from: 0, to: AT.TTFB },
  { metric: 'INP', from: AT.INP, to: AT.PAINT },
] as const;

export type Frame = { t: number; moment?: Moment; changed: boolean; tap: boolean };

/** Each frame is the screen at `t`; it's marked with whatever became visible since the frame before. */
export const FRAMES: Frame[] = Array.from({ length: END / STEP + 1 }, (_, i) => {
  const t = i * STEP;
  const within = (ms: number) => ms > t - STEP && ms <= t;
  const moment = MOMENTS.find((m) => m.metric !== 'TTFB' && within(m.done ?? m.at));
  return { t, moment, changed: Boolean(moment) || within(BODY), tap: within(AT.INP) };
});

export const levelOf = (moment: Moment) => getCoreWebVitalLevel(moment.metric, moment.value);
export const momentOf = (metric: CoreWebVitalName) => MOMENTS.find((moment) => moment.metric === metric)!;
