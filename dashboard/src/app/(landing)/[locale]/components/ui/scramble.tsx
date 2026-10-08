'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789/._-';
const BLANK = String.fromCharCode(0xa0); // no-break space
export const SCRAMBLE_STEP = 26;
const HOLD = 200;
const REROLL = 55;

const roll = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export function Scramble({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shownRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
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
    // React already rendered the new text; show the old until the sweep reaches it
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
    // relative, so the absolute sr-only copy stays inside the text, not off the page
    <span ref={ref} className={cn('relative', className)}>
      <span className='sr-only'>{text}</span>
      <span ref={shownRef} aria-hidden>
        {text}
      </span>
    </span>
  );
}
