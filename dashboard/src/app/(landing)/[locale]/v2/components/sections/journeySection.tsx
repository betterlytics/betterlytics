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
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import styles from './journeySection.module.css';

const ILLUSTRATIONS: Record<JourneyStep['id'], ComponentType<IllustrationProps>> = {
  find: Globe,
  see: Traffic,
  do: Events,
  follow: Replay,
  wait: Vitals,
  errors: Errors,
  reach: Uptime,
};

const TITLE = 'mb-4 text-[length:clamp(27px,2.7vw,36px)] leading-[1.1] font-medium tracking-[-1px]';
const NOTE = 'max-w-[30ch] text-body-sm leading-[22px] text-muted';

const pad = (n: number) => String(n).padStart(2, '0');

/** The viewport's middle 10%: taller than the 46px gap between cards, so a jump never lands with none in it. */
const CENTRE_BAND = '-45% 0px -45% 0px';

type Step = { active: number; direction: 1 | -1 };

const stepTo =
  (active: number) =>
  (step: Step): Step =>
    step.active === active ? step : { active, direction: active > step.active ? 1 : -1 };

const cardsIn = (stack: HTMLElement | null) =>
  Array.from(stack?.querySelectorAll<HTMLElement>(':scope > article') ?? []);

function nearestToViewportCentre(cards: HTMLElement[]) {
  const centre = window.innerHeight / 2;
  const distance = (card: HTMLElement) => {
    const r = card.getBoundingClientRect();
    return Math.abs((r.top + r.bottom) / 2 - centre);
  };
  return cards.reduce((best, card) => (distance(card) < distance(best) ? card : best));
}

/** Visual duplicate of the active card's copy; aria-hidden since the cards carry it for screen readers. */
function Rail({ active, direction }: { active: number; direction: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  const step = JOURNEY_STEPS[active];
  const lines = step.title.split('\n');

  // Sticky top that centres the rail; re-measured per step since the copy changes its height.
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
    // Sticky range is bounded by the margin box, so my-12 keeps the copy clear of the frame's rules.
    <div ref={ref} className='sticky top-0 my-12 pl-7.5 max-2xl:hidden' aria-hidden>
      <p className='mb-3.5 font-mono text-micro tracking-[0.1em] text-muted'>
        <RollingDigits className='text-fg' value={pad(active + 1)} direction={direction} /> /{' '}
        {pad(JOURNEY_STEPS.length)}
      </p>
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
        className={cn(NOTE, 'min-h-11')}
        id={step.id}
        direction={direction}
        delay={(lines.length + 1) * LIFT_STEP_S}
      >
        {step.note}
      </LiftSwap>
    </div>
  );
}

/** `entered` latches so a played illustration stays drawn. From 2xl the copy is sr-only; the rail shows it. */
function JourneyCard({ step, live }: { step: JourneyStep; live: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const entered = useInView(ref);
  const Illustration = ILLUSTRATIONS[step.id];
  const titleId = `${IDS.journey}-${step.id}`;
  return (
    <article ref={ref} aria-labelledby={titleId}>
      <div className='border-x border-rule-10 bg-hatch px-5 py-6 transition-ink 2xl:contents'>
        <h3 id={titleId} className={cn(TITLE, '2xl:sr-only')}>
          {step.title.split('\n').map((line, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span className={cn('block', i === 0 && 'text-muted')}>{line}</span>
            </Fragment>
          ))}
        </h3>
        <p className={cn(NOTE, '2xl:sr-only')}>{step.note}</p>
      </div>
      <div className='border border-rule-10 transition-ink'>
        {/* illustrations keep their size, so taller as it narrows; phones get a fixed height (square at 390px) */}
        <div className='relative aspect-video overflow-hidden max-md:aspect-4/3 max-sm:aspect-auto max-sm:h-89'>
          <div className='absolute inset-0 flex items-center justify-center px-7.5 py-5.5 max-md:p-4'>
            <Illustration entered={entered} live={live} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** `live` gates looping motion and needs the stack on screen, so a jump away leaves nothing looping. */
export function JourneySection() {
  const stackRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(stackRef, 'onScreen');
  const [{ active, direction }, setStep] = useState<Step>({ active: 0, direction: 1 });

  // arriving from either end, start on the card in view rather than where the reader left
  useEffect(() => {
    if (!onScreen) return;
    const cards = cardsIn(stackRef.current);
    if (cards.length) setStep(stepTo(cards.indexOf(nearestToViewportCentre(cards))));
  }, [onScreen]);

  useEffect(() => {
    const cards = cardsIn(stackRef.current);
    const inBand = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting) inBand.add(card);
          else inBand.delete(card);
        }
        if (!inBand.size) return;
        const held = [...inBand].map((card) => cards.indexOf(card));
        const best = cards.indexOf(nearestToViewportCentre([...inBand]));
        // the active card holds until it leaves the band, so two cards in it can't flick the rail
        setStep((step) => (held.includes(step.active) ? step : stepTo(best)(step)));
      },
      { rootMargin: CENTRE_BAND },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    // unbalanced: the plain break gives the underlined word its own line on most phones
    <Section id={IDS.journey} title={COPY.journey.title} lede={COPY.journey.lede} balanced={false}>
      <InkFrame className={styles.frame}>
        <Corners />
        <Rail active={active} direction={direction} />
        <div ref={stackRef} className='relative min-w-0'>
          {/* phones hide the frame's corners, so the stack carries them */}
          <Corners persistent className='sm:hidden' />
          {JOURNEY_STEPS.map((step, i) => (
            <Fragment key={step.id}>
              {i > 0 && (
                <div
                  className='h-11.5 border-x border-rule-10 bg-hatch transition-ink max-2xl:hidden'
                  aria-hidden
                />
              )}
              <JourneyCard step={step} live={onScreen && active === i} />
            </Fragment>
          ))}
        </div>
      </InkFrame>
    </Section>
  );
}
