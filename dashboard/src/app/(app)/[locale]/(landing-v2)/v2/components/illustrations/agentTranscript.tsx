'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';

/* The transcript is mock terminal output, kept literal on purpose. The question
   deliberately needs traffic AND errors, which is impossible unless both live
   in the same tool. */
type Step =
  | { k: 'u'; text: string }
  | { k: 'spin'; ms: number }
  | { k: 'say'; text: string }
  | { k: 'tool'; name: string; arg: string }
  | { k: 'res'; text: string }
  | { k: 'a'; text: string };

const SCRIPT: Step[] = [
  { k: 'u', text: 'which pages lost traffic after the August redesign?' },
  { k: 'spin', ms: 900 },
  { k: 'say', text: "I'll compare pageviews month over month, then look for errors on anything that dropped." },
  {
    k: 'tool',
    name: 'betterlytics – query',
    arg: '(metric: "pageviews", dimension: "url_path", period: "Jul vs Aug")',
  },
  { k: 'res', text: '41 paths · 6 down more than 20%' },
  { k: 'tool', name: 'betterlytics – list_errors', arg: '(url_path: [6 paths], since: "2026-08-01")' },
  { k: 'res', text: '1 group · TypeError · first seen 12 Aug · 1,206 sessions' },
  {
    k: 'a',
    text: '/pricing is down 34%. A TypeError in the plan selector shipped the same day — 1,206 sessions hit it.',
  },
];

type Line = { id: number; step: Step; typed: string; done: boolean };

/** Mounts hidden and lifts in on the next frame, so the CSS transition runs. */
function LineIn({ className, children }: { className: string; children: ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className={cn(className, on && 'in')}>{children}</div>;
}

function Spinner({ since }: { since: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const tick = () => setS(Math.round((Date.now() - since) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);
  return (
    <LineIn className='ag__spin'>
      <i>▪</i>Working…{' '}
      <em>
        ({s}s · ↓ {(0.4 + s * 0.32).toFixed(1)}k tokens · esc to interrupt)
      </em>
    </LineIn>
  );
}

function renderLine(line: Line, showCursor: boolean) {
  const { step } = line;
  switch (step.k) {
    case 'u':
      return (
        <LineIn className='ag__u'>
          <i>&gt;</i>
          <span>{line.typed}</span>
        </LineIn>
      );
    case 'say':
      return (
        <LineIn className='ag__say'>
          <i>●</i>
          {step.text}
        </LineIn>
      );
    case 'tool':
      return (
        <LineIn className='ag__tool'>
          <i>●</i>
          <b>{step.name}</b> <span>(MCP)</span>
          {step.arg}
        </LineIn>
      );
    case 'res':
      return <LineIn className='ag__res'>└─ {step.text}</LineIn>;
    case 'a':
      return (
        <LineIn className='ag__a'>
          {line.typed}
          {showCursor && line.done ? <span className='ag__cur' /> : null}
        </LineIn>
      );
    default:
      return null;
  }
}

/**
 * An agent transcript in the shape an MCP client actually prints one: a
 * prompt, a working indicator, tool calls with their arguments and returned
 * rows, then the answer. Plays only on screen, loops, and renders its final
 * state instantly under reduced motion.
 */
export function AgentTranscript() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.2, once: false });
  const reduce = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([]);
  const [spinSince, setSpinSince] = useState<number | null>(null);
  const [out, setOut] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (reduce) {
      setSpinSince(null);
      setOut(false);
      setLines(
        SCRIPT.filter((s) => s.k !== 'spin').map((step, id) => ({
          id,
          step,
          typed: 'text' in step ? step.text : '',
          done: true,
        })),
      );
      setFinished(true);
      return;
    }
    if (!inView) return;

    let run = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(setTimeout(resolve, ms)));
    let nextId = 0;
    const push = (step: Step) => {
      const id = nextId++;
      setLines((prev) => [...prev, { id, step, typed: '', done: false }]);
      return id;
    };
    const type = async (id: number, text: string, speed: number) => {
      for (let i = 0; i <= text.length; i++) {
        if (!run) return;
        const typed = text.slice(0, i);
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, typed, done: i === text.length } : l)));
        await wait(speed);
      }
    };
    const play = async () => {
      while (run) {
        setLines([]);
        setSpinSince(null);
        setFinished(false);
        for (const step of SCRIPT) {
          if (!run) return;
          switch (step.k) {
            case 'u': {
              const id = push(step);
              await type(id, step.text, 26);
              await wait(380);
              break;
            }
            case 'spin':
              setSpinSince(Date.now());
              await wait(step.ms);
              break;
            case 'say':
              push(step);
              await wait(700);
              break;
            case 'tool':
              push(step);
              await wait(620);
              break;
            case 'res':
              push(step);
              await wait(560);
              break;
            case 'a': {
              setSpinSince(null);
              const id = push(step);
              await type(id, step.text, 17);
              setFinished(true);
              break;
            }
          }
        }
        await wait(5200);
        if (!run) return;
        setOut(true);
        await wait(420);
        setOut(false);
      }
    };
    play();
    return () => {
      run = false;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduce]);

  return (
    <div className='ag'>
      <div className='ag__bar'>
        <i />
        <i />
        <i />
        <b>claude — ~/acme-site</b>
        <span>
          <svg aria-hidden>
            <use href='#lp2-logo' />
          </svg>
          betterlytics mcp
        </span>
      </div>
      <div ref={ref} className={cn('ag__body', out && 'is-out')}>
        {lines.map((line) => (
          <Fragment key={line.id}>
            {renderLine(line, finished && !reduce)}
            {/* the working indicator sits under the prompt; the model's lines land beneath it */}
            {line.step.k === 'u' && spinSince !== null ? <Spinner since={spinSince} /> : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
