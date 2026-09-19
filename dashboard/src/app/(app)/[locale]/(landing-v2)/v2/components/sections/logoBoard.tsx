'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import { PathIcon } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/pathIcon';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import type { LogoStyle, PathIconData } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/icons';

/**
 * The customer wall as a board of flip tiles. Eight slots show the first eight
 * teams; when the pool is larger, one slot at a time turns over to a team that
 * is not on the board. The whole cell is the tile: it rotates on its horizontal
 * centre line, old team on the front, new team on the back, and settles with a
 * small bounce.
 *
 * Quiet by design: one cell at a time, long gaps, never the cell that just
 * flipped, never a team already showing. Paused while off screen or hovered.
 * Static when the pool fits the board or under reduced motion.
 */

export const SLOTS = 8;
const FIRST_GAP_MS = 2400;
const GAP_MS: [number, number] = [3600, 6400];
const FLIP_S = 0.6;
/** Slow release, fast turn, then a short settle. */
const ROTATE = [0, -180, -174, -180];
const TIMES = [0, 0.7, 0.85, 1];
const EASES: Array<[number, number, number, number]> = [
  [0.55, 0, 0.85, 0.35],
  [0.2, 0.8, 0.4, 1],
  [0.6, 0, 0.8, 0.6],
];
/**
 * Light on the card, as a function of its angle rather than of time, so the
 * settle un-shades and re-shades on its own: the front face darkens as it turns
 * edge-on, the back face comes over in shadow and clears as it lands.
 */
const SHADE = {
  front: { angle: [0, -60, -90], opacity: [0, 0.3, 0.75] },
  back: { angle: [-90, -120, -180], opacity: [0.75, 0.3, 0] },
};

export type Logo = { name: string; style?: LogoStyle; icon: PathIconData };

function Mark({ logo }: { logo: Logo }) {
  return (
    <span className={cn('mk', logo.style && `mk--${logo.style}`)}>
      <PathIcon icon={logo.icon} className='lgico' />
      <b>{logo.name}</b>
    </span>
  );
}

function Shade({ angle, of }: { angle: MotionValue<number>; of: { angle: number[]; opacity: number[] } }) {
  const opacity = useTransform(angle, of.angle, of.opacity);
  return <motion.span className='flap__shade' style={{ opacity }} />;
}

/**
 * Rendered inside the cell while it turns. The new mark sits in flow, hidden,
 * so the cell keeps its size; the card covers it, old mark on the front and
 * new mark on the back. Rotating the card -180° brings the back over.
 *
 * One motion value drives the card and, through it, the shades, so they can
 * never drift apart. `onDone` is read through a ref: the board re-renders on
 * hover, and the flip must not restart when it does.
 */
function Flap({ from, to, onDone }: { from: Logo; to: Logo; onDone: () => void }) {
  const angle = useMotionValue(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const run = animate(angle, ROTATE, {
      duration: FLIP_S,
      times: TIMES,
      ease: EASES,
      onComplete: () => done.current(),
    });
    return () => run.stop();
  }, [angle]);

  return (
    <>
      <span className='flap__size'>
        <Mark logo={to} />
      </span>
      <motion.span className='flap__tile' aria-hidden style={{ rotateX: angle }}>
        <span className='flap__face flap__face--front'>
          <Mark logo={from} />
          <Shade angle={angle} of={SHADE.front} />
        </span>
        <span className='flap__face flap__face--back'>
          <Mark logo={to} />
          <Shade angle={angle} of={SHADE.back} />
        </span>
      </motion.span>
    </>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function LogoBoard({ pool, label }: { pool: ReadonlyArray<Logo>; label: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.4, rootMargin: '0px', once: false });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [shown, setShown] = useState(() => range(Math.min(SLOTS, pool.length)));
  const [flip, setFlip] = useState<{ slot: number; to: number } | null>(null);
  const lastSlot = useRef(-1);
  const gap = useRef(FIRST_GAP_MS);

  const cycles = pool.length > SLOTS && !reduce;
  const active = cycles && inView && !hover && !flip;

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      const slot = pick(range(shown.length).filter((i) => i !== lastSlot.current));
      const to = pick(range(pool.length).filter((i) => !shown.includes(i)));
      gap.current = between(GAP_MS);
      setFlip({ slot, to });
    }, gap.current);
    return () => window.clearTimeout(t);
  }, [active, shown, pool.length]);

  const done = () => {
    if (!flip) return;
    lastSlot.current = flip.slot;
    setShown((s) => s.map((v, i) => (i === flip.slot ? flip.to : v)));
    setFlip(null);
  };

  return (
    <div
      ref={ref}
      className={cn('logos', cycles && 'logos--board')}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className='logos__label'>{label}</div>
      {shown.map((idx, slot) => (
        <span key={slot} className={cn('lg', flip?.slot === slot && 'is-flipping')}>
          {flip?.slot === slot ? (
            <Flap from={pool[idx]} to={pool[flip.to]} onDone={done} />
          ) : (
            <Mark logo={pool[idx]} />
          )}
        </span>
      ))}
    </div>
  );
}
