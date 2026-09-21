'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { TESTIMONIALS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/testimonials';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';

const DWELL_MS = 7000;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * One quote at a time under the logo wall, in display type, turning over on a
 * slow timer. Every quote is rendered into the same grid cell so the block is
 * as tall as its longest quote and nothing below it moves when the quote
 * changes. Paused off screen, on hover, and under reduced motion; the dots
 * pick a quote by hand.
 */
export function FeaturedQuote() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.5, rootMargin: '0px', once: false });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [index, setIndex] = useState(0);

  const active = inView && !hover && !reduce;
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), DWELL_MS);
    return () => window.clearTimeout(t);
  }, [active, index]);

  return (
    <div ref={ref} className='fq' onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div className='fq__stage'>
        {TESTIMONIALS.map((t, i) => (
          <figure key={t.name} className={cn('fq__item', i === index && 'is-on')} aria-hidden={i !== index}>
            <blockquote>
              <p>
                <Emphasis text={t.quote} wrap={(span) => <b>{span}</b>} />
              </p>
            </blockquote>
            <figcaption>
              <span className='fq__av' aria-hidden>
                {t.avatar ? (
                  <Image src={`/images/testimonials/${t.avatar}`} alt='' width={44} height={44} unoptimized />
                ) : (
                  initials(t.name)
                )}
              </span>
              <span className='fq__who'>
                <b>{t.name}</b>
                <span>{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className='fq__dots' role='tablist'>
        {TESTIMONIALS.map((t, i) => (
          <button
            key={t.name}
            type='button'
            role='tab'
            aria-selected={i === index}
            aria-label={t.name}
            className={cn(i === index && 'is-on')}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
