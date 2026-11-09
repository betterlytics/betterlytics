'use client';

import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useLocale } from 'next-intl';

/** Cancels NumberFlow's mask padding so a figure lays out like text. */
const FLUSH = '[--number-flow-mask-height:0.25em] -my-(--number-flow-mask-height)';

/** Rolls from `from` to `to` while a mouse is over the nearest `[data-hover-art]`, like the CSS hover states beside it. */
export function HoverNumber({ from, to }: { from: number; to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const art = ref.current?.closest('[data-hover-art]');
    if (!art) return;
    const enter = (event: Event) => {
      if ((event as PointerEvent).pointerType === 'mouse') setHovered(true);
    };
    const leave = () => setHovered(false);
    art.addEventListener('pointerenter', enter);
    art.addEventListener('pointerleave', leave);
    return () => {
      art.removeEventListener('pointerenter', enter);
      art.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <span ref={ref}>
      <NumberFlow className={FLUSH} value={hovered ? to : from} locales={locale} willChange />
    </span>
  );
}
