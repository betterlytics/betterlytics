'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, m, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import type { LogoStyle, PathIconData } from '@/landing/lib/icons';
import styles from './logoBoard.module.css';

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

const SLOTS = 8;
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
 * Light as a function of the card's angle rather than of time, so the settle
 * un-shades and re-shades on its own: the front face darkens as it turns
 * edge-on, the back face comes over in shadow and clears as it lands. The
 * card's own tone and edge, and the slot behind it, exist only while the card
 * is off-plane: up over the first degrees of the turn, gone over the last, so
 * at landing the card already looks like a resting cell and its unmount is
 * invisible. No afterglow, no pop.
 */
const SHADE = {
  front: { angle: [0, -60, -90], opacity: [0, 0.3, 0.75] },
  back: { angle: [-90, -120, -180], opacity: [0.75, 0.3, 0] },
  liftFront: { angle: [0, -30], opacity: [0, 1] },
  liftBack: { angle: [-150, -180], opacity: [1, 0] },
  slot: { angle: [0, -30, -150, -180], opacity: [0, 1, 1, 0] },
};

/** Real logo walls are typographically inconsistent, and that is what sells them. */
const WORDMARK = {
  plain: 'text-[16.5px] font-semibold tracking-[-0.3px]',
  caps: 'text-caption font-semibold tracking-[0.14em] uppercase',
  light: 'text-[17.5px] font-normal tracking-[-0.4px]',
  tight: 'text-[16px] font-semibold tracking-[-0.7px]',
  wide: 'text-body-sm font-medium tracking-[0.05em]',
} satisfies Record<LogoStyle | 'plain', string>;

type Logo = { name: string; style?: LogoStyle; icon: PathIconData };

/** A team's mark: icon and wordmark. One per still cell, three per flipping one. */
function Mark({ logo, className }: { logo: Logo; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 whitespace-nowrap', className)}>
      <PathIcon icon={logo.icon} className='size-[22px] flex-none' />
      <b className={cn('truncate', WORDMARK[logo.style ?? 'plain'])}>{logo.name}</b>
    </span>
  );
}

function Veil({
  angle,
  of,
  className,
}: {
  angle: MotionValue<number>;
  of: { angle: number[]; opacity: number[] };
  className: string;
}) {
  const opacity = useTransform(angle, of.angle, of.opacity);
  return <m.span className={className} style={{ opacity }} />;
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
      <span className={styles.size}>
        <Mark logo={to} />
      </span>
      <Veil angle={angle} of={SHADE.slot} className={styles.slot} />
      <m.span className={styles.tile} aria-hidden style={{ rotateX: angle }}>
        <span className={styles.face}>
          <Veil angle={angle} of={SHADE.liftFront} className={styles.lift} />
          {/* positioned, so it paints in tree order between the veils: over the lift, under
              the shade (unpositioned, it would paint under both) */}
          <Mark logo={from} className='relative' />
          <Veil angle={angle} of={SHADE.front} className={styles.shade} />
        </span>
        <span className={cn(styles.face, styles.back)}>
          <Veil angle={angle} of={SHADE.liftBack} className={styles.lift} />
          <Mark logo={to} className='relative' />
          <Veil angle={angle} of={SHADE.back} className={styles.shade} />
        </span>
      </m.span>
    </>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function LogoBoard({ pool, label }: { pool: ReadonlyArray<Logo>; label: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 'onScreen');
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
      className={styles.board}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <p
        className={cn(
          styles.label,
          'grid place-items-center px-[18px] py-[30px] text-center text-[14.5px] leading-normal transition-ink max-xl:p-6',
        )}
      >
        {/* one grid item, so the claim sets as a single unbroken line */}
        <span className='whitespace-nowrap'>{label}</span>
      </p>
      {shown.map((idx, slot) => (
        <span
          key={slot}
          className={cn(
            styles.cell,
            'flex items-center justify-center px-3.5 py-[30px] opacity-78 transition-ink hover:opacity-100',
          )}
          data-flipping={flip?.slot === slot || undefined}
        >
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
