'use client';

import { Fragment, useEffect, useRef, useState, type ComponentType } from 'react';
import { Errors } from '@/landing/components/illustrations/errors';
import { Events } from '@/landing/components/illustrations/events';
import { Globe } from '@/landing/components/illustrations/globe';
import { Replay } from '@/landing/components/illustrations/replay';
import { Traffic } from '@/landing/components/illustrations/traffic';
import type { IllustrationProps } from '@/landing/components/illustrations/types';
import { Uptime } from '@/landing/components/illustrations/uptime';
import { Vitals } from '@/landing/components/illustrations/vitals';
import { Corners, Section } from '@/landing/components/ui/frame';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { LIFT_STEP_S, LiftSwap } from '@/landing/components/ui/liftSwap';
import { RollingDigits } from '@/landing/components/ui/rollingDigits';
import { COPY } from '@/landing/content/copy';
import { JOURNEY_STEPS, type JourneyStep } from '@/landing/content/journey';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import styles from './journeySection.module.css';

/** Which illustration plays alongside each step. Swap an entry to replace a renderer. */
const ILLUSTRATIONS: Record<JourneyStep['id'], ComponentType<IllustrationProps>> = {
  find: Globe,
  see: Traffic,
  do: Events,
  follow: Replay,
  wait: Vitals,
  errors: Errors,
  reach: Uptime,
};

/** The rail's headline and the note under it. */
const TITLE = 'mb-4 text-[length:clamp(27px,2.7vw,36px)] leading-[1.1] font-medium tracking-[-1px]';
const NOTE = 'max-w-[30ch] text-body-sm leading-[22px] text-muted';

const pad = (n: number) => String(n).padStart(2, '0');

/** Index of the card whose centre is nearest the viewport centre, or -1 if none is on screen. */
function nearestToViewportCentre(cards: (HTMLElement | null)[]) {
  const centre = window.innerHeight / 2;
  let best = -1;
  let bestDistance = Infinity;
  cards.forEach((card, i) => {
    if (!card) return;
    const r = card.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const d = Math.abs((r.top + r.bottom) / 2 - centre);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}

/**
 * The active step's copy, moving as one block when the step changes: the counter
 * rolls, then the headline lines and the note each blur-lift a beat after the one
 * above, in the direction the reader is scrolling. The cards carry the same copy
 * for screen readers, so this visual duplicate is hidden from them.
 */
function Rail({ active, direction }: { active: number; direction: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  const step = JOURNEY_STEPS[active];
  const lines = step.title.split('\n');

  // Pin point: the sticky offset that lands the rail on the viewport's vertical
  // centre. Re-measured when the copy changes, since it changes the rail's height.
  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    const place = () => {
      rail.style.top = `${Math.max(0, (window.innerHeight - rail.offsetHeight) / 2)}px`;
    };
    place();
    window.addEventListener('resize', place, { passive: true });
    document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [active]);

  return (
    // Sticky with `top` at the centred offset: in flow at the column top, pinned once it
    // reaches the middle of the viewport, released at the column end. The sticky box is
    // bounded by its margin box, so the margins keep the copy clear of the frame's rules.
    <div
      ref={ref}
      className='sticky top-0 my-12 pl-7.5 max-2xl:static max-2xl:my-0 max-2xl:pt-7 max-2xl:pl-0'
      aria-hidden
    >
      <p className='mb-3.5 font-mono text-micro tracking-[0.1em] text-muted'>
        <RollingDigits className='text-fg' value={pad(active + 1)} direction={direction} /> /{' '}
        {pad(JOURNEY_STEPS.length)}
      </p>
      {/* Stacked in one cell: below 2xl the rail sits in flow above the cards, so every
          step's copy is laid out there invisibly and the rail keeps the tallest one's
          height, rather than moving the cards each time the step changes. */}
      <div className='grid'>
        {JOURNEY_STEPS.map(({ id, title, note }) => (
          <div key={id} className='invisible col-start-1 row-start-1 hidden max-2xl:block'>
            <p className={TITLE}>
              {title.split('\n').map((line, i) => (
                <span key={i} className='block'>
                  {line}
                </span>
              ))}
            </p>
            <p className={NOTE}>{note}</p>
          </div>
        ))}
        <div className='col-start-1 row-start-1'>
          {/* the first line is the part the steps share, so it sits back in the muted tone */}
          <p className={TITLE}>
            {lines.map((line, i) => (
              <LiftSwap
                key={i}
                id={line}
                as='span'
                className={cn('block', i === 0 && 'text-muted')}
                direction={direction}
                delay={(i + 1) * LIFT_STEP_S}
              >
                {line}
              </LiftSwap>
            ))}
          </p>
          <LiftSwap
            as='p'
            className={cn(NOTE, 'min-h-11 max-2xl:min-h-0')}
            id={step.id}
            direction={direction}
            delay={(lines.length + 1) * LIFT_STEP_S}
          >
            {step.note}
          </LiftSwap>
        </div>
      </div>
    </div>
  );
}

/**
 * Sticky rail + scrolling card stack. The rail carries the copy of whichever card
 * is nearest the middle of the viewport; each card shows only its illustration.
 *
 * Two things are tracked per card. `entered` latches the moment a card first
 * scrolls into view and is never cleared, so an illustration that has played
 * stays drawn. `live` follows the active card and only gates looping motion.
 */
export function JourneySection() {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  // `direction` is which way the reader went, so the rail copy leaves and arrives the same way
  const [{ active, direction }, setStep] = useState<{ active: number; direction: 1 | -1 }>({
    active: 0,
    direction: 1,
  });
  const [entered, setEntered] = useState<boolean[]>(() => JOURNEY_STEPS.map(() => false));

  useEffect(() => {
    let ticking = false;
    const pick = () => {
      const best = nearestToViewportCentre(cardRefs.current);
      if (best < 0) return;
      setStep((step) => (step.active === best ? step : { active: best, direction: best > step.active ? 1 : -1 }));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        pick();
        ticking = false;
      });
    };
    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', pick, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', pick);
    };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = Number((entry.target as HTMLElement).dataset.index);
          setEntered((prev) => (prev[i] ? prev : prev.map((v, j) => (j === i ? true : v))));
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 },
    );
    cardRefs.current.forEach((card) => card && io.observe(card));
    return () => io.disconnect();
  }, []);

  return (
    <Section id={IDS.journey} title={COPY.journey.title} lede={COPY.journey.lede}>
      <InkFrame className={styles.frame}>
        <Corners />
        <Rail active={active} direction={direction} />
        <div className='min-w-0'>
          {JOURNEY_STEPS.map((step, i) => {
            const Illustration = ILLUSTRATIONS[step.id];
            const live = active === i;
            const titleId = `${IDS.journey}-${step.id}`;
            return (
              <Fragment key={step.id}>
                {/* the hatched band between cards, in the wall's material */}
                {i > 0 && <div className='h-11.5 border-x border-rule-10 bg-hatch transition-ink' aria-hidden />}
                <article
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  data-index={i}
                  aria-labelledby={titleId}
                  className='border border-rule-10 transition-ink'
                >
                  {/* the rail shows only the active step, so screen readers get each step's copy here, in order */}
                  <h3 id={titleId} className='sr-only'>
                    {step.title.split('\n').join(' ')}
                  </h3>
                  <p className='sr-only'>{step.note}</p>
                  <div className='relative aspect-video overflow-hidden max-md:aspect-4/3'>
                    <div className='absolute inset-0 flex items-center justify-center px-7.5 py-5.5 max-md:p-4'>
                      <Illustration entered={entered[i]} live={live} />
                    </div>
                  </div>
                </article>
              </Fragment>
            );
          })}
        </div>
      </InkFrame>
    </Section>
  );
}
