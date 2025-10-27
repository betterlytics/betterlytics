// components/animation/MotionText.tsx
'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion, LazyMotion, domAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

type Dir = 'up' | 'down' | 'none';

const isDigit = (ch: string) => ch >= '0' && ch <= '9';

export type MotionTextProps = {
  text: string;
  className?: string; // wrapper classes
  charClassName?: string; // per-char slot classes
  y?: number; // travel distance; default 12
  duration?: number; // used when punchy=false (tween)
  initialOnMount?: boolean; // animate initial mount
  gap?: string; // tailwind gap class; default 'gap-[0.05em]'
  disableAnimation?: boolean;
  punchy?: boolean; // stronger motion preset (default true)
  presenceMode?: 'wait' | 'sync'; // control enter/exit sequencing; default 'wait'
  defaultDirection?: Dir; // default direction for non-numeric chars; default 'up'
} & Omit<React.ComponentProps<'span'>, 'children'>;

function MotionTextComponent({
  text,
  className,
  charClassName,
  y = 12,
  duration = 0.2,
  initialOnMount = false,
  gap = 'gap-[0.05em]',
  disableAnimation,
  punchy = true,
  presenceMode = 'wait',
  defaultDirection = 'up',
  ...rest
}: MotionTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !(disableAnimation ?? false) && !prefersReducedMotion;

  const chars = React.useMemo(() => Array.from(text), [text]);

  const prevRef = React.useRef<string[]>(chars);
  const prev = prevRef.current;

  const dirs = React.useMemo(() => {
    const out: Dir[] = new Array(chars.length);
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const p = prev[i] ?? '';
      if (ch === p) {
        out[i] = 'none';
        continue;
      }
      if (isDigit(ch) && isDigit(p)) {
        out[i] = ch.charCodeAt(0) > p.charCodeAt(0) ? 'down' : 'up';
      } else {
        out[i] = defaultDirection;
      }
    }
    return out;
  }, [text]);

  React.useEffect(() => {
    prevRef.current = chars;
  }, [chars]);

  const enterTransition = React.useMemo(
    () =>
      punchy
        ? ({
            type: 'spring',
            stiffness: 650,
            damping: 32,
            mass: 0.55,
            restDelta: 0.5,
            restSpeed: 100,
          } as const)
        : { duration, ease: 'easeOut' as const },
    [punchy, duration],
  );

  const exitTransition = React.useMemo(
    () =>
      ({
        type: 'spring',
        stiffness: 620,
        damping: 36,
        mass: 0.55,
        restDelta: 0.5,
        restSpeed: 100,
        opacity: { duration: 0.18, ease: 'easeOut' },
      }) as const,
    [],
  );

  if (!shouldAnimate) {
    return (
      <span className={cn('inline-flex leading-none', gap, className)} {...rest}>
        {chars.map((char, i) => (
          <span
            key={i}
            className={cn(
              'inline-block h-[1em] w-[1ch] text-center align-baseline tabular-nums select-none',
              charClassName,
            )}
          >
            {char}
          </span>
        ))}
      </span>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <span
        className={cn('content-visibility-auto inline-flex leading-none will-change-transform', gap, className)}
        style={{ containIntrinsicInlineSize: 'auto', containIntrinsicBlockSize: '1em' }}
        {...rest}
      >
        {chars.map((char, i) => {
          const dir = dirs[i];
          const enterFrom = dir === 'down' ? -y : y;
          const exitTo = dir === 'down' ? y : -y;
          return (
            <span
              key={i}
              className={cn(
                'relative inline-block h-[1em] w-[1ch] text-center align-baseline tabular-nums select-none',
                charClassName,
              )}
            >
              <AnimatePresence mode={presenceMode} initial={false}>
                <motion.span
                  key={char}
                  initial={initialOnMount ? { opacity: 0.001, y: enterFrom, scale: punchy ? 0.96 : 1 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: enterTransition }}
                  exit={{ opacity: 0, y: exitTo, scale: punchy ? 0.96 : 1, transition: exitTransition }}
                  className='absolute inset-0 transform-gpu will-change-transform'
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        })}
      </span>
    </LazyMotion>
  );
}

export const MotionText = React.memo(MotionTextComponent);
