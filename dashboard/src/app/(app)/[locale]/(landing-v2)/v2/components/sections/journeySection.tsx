'use client';

import { Fragment, useEffect, useRef, useState, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { Errors } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/errors';
import { Events } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/events';
import { Globe } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/globe';
import { Replay } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/replay';
import { Traffic } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/traffic';
import type { IllustrationProps } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/types';
import { Uptime } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/uptime';
import { Vitals } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/vitals';
import { Corners, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { JOURNEY_STEPS, type JourneyStep } from '@/app/(app)/[locale]/(landing-v2)/v2/content/journey';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

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

const SWAP_MS = 240;

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
 * Sticky rail + scrolling card stack. The rail carries all the copy: the stem
 * stays put and only the tail phrase and note swap, so the eye reads one
 * sentence changing rather than seven sentences swapping.
 *
 * Two things are tracked per card. `entered` latches the moment a card first
 * scrolls into view and is never cleared, so an illustration that has played
 * stays drawn. `live` follows the active card and only gates looping motion.
 */
export function JourneySection() {
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [entered, setEntered] = useState<boolean[]>(() => JOURNEY_STEPS.map(() => false));

  // Pin point: the sticky offset that lands the rail on the viewport's vertical
  // centre. Re-measured when the copy changes, since it changes the rail's height.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const place = () => {
      rail.style.top = `${Math.max(0, (window.innerHeight - rail.offsetHeight) / 2)}px`;
    };
    place();
    window.addEventListener('resize', place, { passive: true });
    document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [shown]);

  useEffect(() => {
    let ticking = false;
    const pick = () => {
      const best = nearestToViewportCentre(cardRefs.current);
      if (best >= 0) setActive(best);
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

  // Swap the rail copy on a short blur-and-lift.
  useEffect(() => {
    if (active === shown) return;
    if (reduce) {
      setShown(active);
      return;
    }
    setSwapping(true);
    const timer = setTimeout(() => {
      setShown(active);
      setSwapping(false);
    }, SWAP_MS);
    return () => clearTimeout(timer);
  }, [active, shown, reduce]);

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

  const step = JOURNEY_STEPS[shown];

  return (
    <Section id={IDS.journey}>
      <SectionHead title={COPY.journey.title} lede={COPY.journey.lede} />
      <div className='jr'>
        <Corners />
        <aside ref={railRef} className={cn('jr__rail', swapping && 'is-swap')}>
          <h3 className='jr__title'>
            <span className='jr__stem'>{COPY.journey.stem}</span>
            <span className='jr__word'>{step.word}</span>
          </h3>
          <p className='jr__note'>{step.note}</p>
          <p className='jr__repl'>{step.replaces}</p>
        </aside>
        <div className='jr__stack'>
          {JOURNEY_STEPS.map(({ id }, i) => {
            const Illustration = ILLUSTRATIONS[id];
            const live = active === i;
            return (
              <Fragment key={id}>
                {i > 0 && <div className='jr__band' aria-hidden />}
                <article
                  className='jr__card'
                  data-index={i}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                >
                  <div className='jr__art'>
                    <div className={cn('fig', entered[i] && 'is-in', live && 'is-live')}>
                      <Illustration entered={entered[i]} live={live} />
                    </div>
                  </div>
                </article>
              </Fragment>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
