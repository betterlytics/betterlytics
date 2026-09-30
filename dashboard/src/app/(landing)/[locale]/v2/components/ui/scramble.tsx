'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789/._-';
const BLANK = String.fromCharCode(0xa0); // no-break space
/** ms between one character starting to scramble and the next */
export const SCRAMBLE_STEP = 26;
/** ms each character scrambles before it settles */
const HOLD = 200;
/** ms between rerolls of the scrambling characters */
const REROLL = 55;

const roll = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/**
 * Monospace text that spells itself out: characters start scrambling left to
 * right and each settles after a short hold, so a scrambling tail runs ahead of
 * the settled text. It plays when the text first scrolls into view and again,
 * from the old text, whenever `text` changes. Unstarted positions hold a
 * no-break space, so the line keeps its width while it fills. Frames are written
 * straight to the DOM, so nothing re-renders while it plays. Screen readers get
 * the real text; reduced motion shows it at once.
 */
export function Scramble({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shownRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  /* what has settled on screen; starts empty so the first play spells in from nothing */
  const settled = useRef('');

  useEffect(() => {
    const shown = shownRef.current;
    if (!shown) return;
    if (reduce) {
      settled.current = text;
      shown.textContent = text;
      return;
    }
    if (!inView) {
      shown.textContent = BLANK.repeat(text.length);
      return;
    }
    const from = settled.current;
    if (from === text) {
      shown.textContent = text;
      return;
    }
    const n = Math.max(from.length, text.length);
    const glyphs = Array.from({ length: n }, roll);
    // React has already written the new text; the old one holds until the sweep reaches it
    shown.textContent = from.padEnd(n, BLANK);
    let start = 0;
    let rerolled = 0;
    let raf = 0;
    const frame = (now: number) => {
      if (!start) start = now + delay;
      const t = now - start;
      if (t >= (n - 1) * SCRAMBLE_STEP + HOLD) {
        settled.current = text;
        shown.textContent = text;
        return;
      }
      if (now - rerolled > REROLL) {
        rerolled = now;
        for (let i = 0; i < n; i++) glyphs[i] = roll();
      }
      let s = '';
      for (let i = 0; i < n; i++) {
        const at = i * SCRAMBLE_STEP;
        if (t < at) s += from[i] ?? BLANK;
        else if (t < at + HOLD) s += text[i] === ' ' ? ' ' : glyphs[i];
        else s += text[i] ?? BLANK;
      }
      shown.textContent = s;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [text, inView, reduce, delay]);

  return (
    // relative, so the screen-reader copy is positioned inside the text rather than off the page
    <span ref={ref} className={cn('relative', className)}>
      <span className='sr-only'>{text}</span>
      <span ref={shownRef} aria-hidden>
        {text}
      </span>
    </span>
  );
}
