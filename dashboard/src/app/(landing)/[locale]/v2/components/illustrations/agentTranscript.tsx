'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { useInView } from '@/landing/hooks/useInView';
import { useReducedMotion } from '@/landing/hooks/useReducedMotion';
import { FlareShimmer } from './flareShimmer';

/* The transcript is mock terminal output, kept literal on purpose. Each question
   deliberately needs two parts of the product at once (traffic and errors,
   uptime and sales, acquisition and signups), which is impossible unless they
   live in the same tool. Tool names and inputs are the MCP server's real ones
   (src/mcp/tools/describe.ts). */
type Step =
  | { k: 'u'; text: string }
  | { k: 'spin'; ms: number }
  | { k: 'say'; text: string }
  | { k: 'tool'; name: string; arg: string }
  | { k: 'res'; text: string }
  | { k: 'a'; text: string };

/** Played in order and looped; the first is the one most visitors see. */
const SCRIPTS: Step[][] = [
  [
    { k: 'u', text: 'which pages lost traffic after the August redesign?' },
    { k: 'spin', ms: 900 },
    {
      k: 'say',
      text: "I'll compare daily pageviews across July and August, then look for errors on anything that dropped.",
    },
    {
      k: 'tool',
      name: 'betterlytics – query',
      arg: '(metrics: ["pageviews"], dimensions: ["url"], timeRange: "custom", startDate: "2026-07-01", endDate: "2026-08-31", granularity: "day")',
    },
    { k: 'res', text: '41 paths · 6 down more than 20%' },
    { k: 'tool', name: 'betterlytics – list_errors', arg: '(filters: [url in (6 paths)], timeRange: "90d")' },
    { k: 'res', text: '1 group · TypeError · first seen 12 Aug · 1,206 sessions' },
    {
      k: 'a',
      text: '/pricing is down 34%. A TypeError in the plan selector shipped the same day — 1,206 sessions hit it.',
    },
  ],
  [
    { k: 'u', text: "did last night's checkout outage cost us sales?" },
    { k: 'spin', ms: 900 },
    { k: 'say', text: "I'll find the incident, then line purchases up against it hour by hour." },
    { k: 'tool', name: 'betterlytics – list_monitor_incidents', arg: '(monitorId: "checkout", timeRange: "24h")' },
    { k: 'res', text: '1 incident · down 23:12–23:31 · resolved' },
    {
      k: 'tool',
      name: 'betterlytics – query',
      arg: '(metrics: ["custom_events"], filters: [custom_event_name = "purchase"], granularity: "hour", timeRange: "7d")',
    },
    { k: 'res', text: '23:00 → 6 purchases · same hour, previous 6 nights: 38 on average' },
    {
      k: 'a',
      text: 'Yes. Checkout was down for 19 minutes, and that hour took 6 purchases against a usual 38 — about 32 sales lost.',
    },
  ],
  [
    { k: 'u', text: 'which traffic source brings visitors who actually sign up?' },
    { k: 'spin', ms: 900 },
    { k: 'say', text: "I'll pull visitors by source, then signups by source, and compare the rates." },
    {
      k: 'tool',
      name: 'betterlytics – query',
      arg: '(metrics: ["visitors"], dimensions: ["referrer_source_name"], timeRange: "28d")',
    },
    { k: 'res', text: 'Google 18.2k · ChatGPT 2.1k · Hacker News 1.4k' },
    {
      k: 'tool',
      name: 'betterlytics – query',
      arg: '(metrics: ["custom_events"], dimensions: ["referrer_source_name"], filters: [custom_event_name = "signup"], timeRange: "28d")',
    },
    { k: 'res', text: 'Google 164 · ChatGPT 71 · Hacker News 9' },
    {
      k: 'a',
      text: 'ChatGPT sends a ninth of the visitors Google does, but 3.4% of them sign up against 0.9% — nearly four times the rate.',
    },
  ],
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
  const inView = useInView(ref, 'onScreen');
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
        SCRIPTS[0]
          .filter((s) => s.k !== 'spin')
          .map((step, id) => ({
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
      for (let s = 0; run; s = (s + 1) % SCRIPTS.length) {
        setLines([]);
        setSpinSince(null);
        setFinished(false);
        for (const step of SCRIPTS[s]) {
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
      <FlareShimmer live={inView && !reduce} />
      <div className='ag__bar'>
        <i />
        <i />
        <i />
        <b>claude — ~/acme-site</b>
        <span>
          <BrandMark />
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
