'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { COPY } from '@/landing/content/copy';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import styles from './agentTranscript.module.css';
import { FLARE_FIELD, FlareShimmer } from './flareShimmer';

/* Mock terminal output, kept literal on purpose. Tool names and args match src/mcp/tools/describe.ts. */
type Step =
  | { kind: 'question'; text: string }
  | { kind: 'working'; ms: number }
  | { kind: 'say'; text: string }
  | { kind: 'tool'; name: string; args: string }
  | { kind: 'result'; text: string }
  | { kind: 'answer'; text: string };

/** The first is also the static state (no JS or reduced motion). */
const SCRIPTS: Step[][] = [
  [
    { kind: 'question', text: 'which pages lost traffic after the August redesign?' },
    { kind: 'working', ms: 900 },
    {
      kind: 'say',
      text: "I'll compare daily pageviews across July and August, then look for errors on anything that dropped.",
    },
    {
      kind: 'tool',
      name: 'betterlytics – query',
      args: '(metrics: ["pageviews"], dimensions: ["url"], timeRange: "custom", startDate: "2026-07-01", endDate: "2026-08-31", granularity: "day")',
    },
    { kind: 'result', text: '41 paths · 6 down more than 20%' },
    { kind: 'tool', name: 'betterlytics – list_errors', args: '(filters: [url in (6 paths)], timeRange: "90d")' },
    { kind: 'result', text: '1 group · TypeError · first seen 12 Aug · 1,206 sessions' },
    {
      kind: 'answer',
      text: '/pricing is down 34%. A TypeError in the plan selector shipped the same day — 1,206 sessions hit it.',
    },
  ],
  [
    { kind: 'question', text: "did last night's checkout outage cost us sales?" },
    { kind: 'working', ms: 900 },
    { kind: 'say', text: "I'll find the incident, then line purchases up against it hour by hour." },
    {
      kind: 'tool',
      name: 'betterlytics – list_monitor_incidents',
      args: '(monitorId: "checkout", timeRange: "24h")',
    },
    { kind: 'result', text: '1 incident · down 23:12–23:31 · resolved' },
    {
      kind: 'tool',
      name: 'betterlytics – query',
      args: '(metrics: ["custom_events"], filters: [custom_event_name = "purchase"], granularity: "hour", timeRange: "7d")',
    },
    { kind: 'result', text: '23:00 → 6 purchases · same hour, previous 6 nights: 38 on average' },
    {
      kind: 'answer',
      text: 'Yes. Checkout was down for 19 minutes, and that hour took 6 purchases against a usual 38 — about 32 sales lost.',
    },
  ],
  [
    { kind: 'question', text: 'which traffic source brings visitors who actually sign up?' },
    { kind: 'working', ms: 900 },
    { kind: 'say', text: "I'll pull visitors by source, then signups by source, and compare the rates." },
    {
      kind: 'tool',
      name: 'betterlytics – query',
      args: '(metrics: ["visitors"], dimensions: ["referrer_source_name"], timeRange: "28d")',
    },
    { kind: 'result', text: 'Google 18.2k · ChatGPT 2.1k · Hacker News 1.4k' },
    {
      kind: 'tool',
      name: 'betterlytics – query',
      args: '(metrics: ["custom_events"], dimensions: ["referrer_source_name"], filters: [custom_event_name = "signup"], timeRange: "28d")',
    },
    { kind: 'result', text: 'Google 164 · ChatGPT 71 · Hacker News 9' },
    {
      kind: 'answer',
      text: 'ChatGPT sends a ninth of the visitors Google does, but 3.4% of them sign up against 0.9% — nearly four times the rate.',
    },
  ],
];

/** In ms; question and answer are per character. */
const PACE = {
  question: 26,
  answer: 17,
  afterQuestion: 380,
  say: 700,
  tool: 620,
  result: 560,
  read: 5200,
  fade: 420,
} as const;

/** Times in ms from the script's start. */
type Cue = { step: Step; from: number; to: number };

type Timeline = {
  cues: Cue[];
  done: number;
  out: number;
  end: number;
};

function toTimeline(script: Step[]): Timeline {
  const cues: Cue[] = [];
  let working: Cue | undefined;
  let t = 0;
  for (const step of script) {
    const cue: Cue = { step, from: t, to: Infinity };
    switch (step.kind) {
      case 'question':
        t += (step.text.length + 1) * PACE.question + PACE.afterQuestion;
        break;
      case 'working':
        working = cue;
        t += step.ms;
        break;
      case 'say':
      case 'tool':
      case 'result':
        t += PACE[step.kind];
        break;
      case 'answer':
        if (working) working.to = t;
        t += (step.text.length + 1) * PACE.answer;
        break;
    }
    cues.push(cue);
  }
  return { cues, done: t, out: t + PACE.read, end: t + PACE.read + PACE.fade };
}

const TIMELINES = SCRIPTS.map(toTimeline);

const readout = (seconds: number) =>
  `(${seconds}s · ↓ ${(0.4 + seconds * 0.32).toFixed(1)}k tokens · esc to interrupt)`;

function liveText(step: Step, elapsed: number) {
  switch (step.kind) {
    case 'question':
    case 'answer':
      return step.text.slice(0, Math.floor(elapsed / PACE[step.kind]));
    case 'working':
      return readout(Math.floor(elapsed / 1000));
    default:
      return null;
  }
}

/** Writes the state `t` ms into the script straight to the DOM, touching only what changed. */
function stage(body: HTMLElement, { cues, done, out }: Timeline, t: number) {
  body.toggleAttribute('data-out', t >= out);
  body.toggleAttribute('data-done', t >= done);
  cues.forEach(({ step, from, to }, i) => {
    const line = body.children[i];
    const shown = t >= from && t < to;
    line.toggleAttribute('data-shown', shown);
    const text = shown ? liveText(step, t - from) : null;
    const target = text === null ? null : line.querySelector('[data-text]');
    if (target && target.textContent !== text) target.textContent = text;
  });
}

/** `stage` rewrites the `data-text` part; React never updates these lines, so the two don't collide. */
function Line({ step }: { step: Step }) {
  switch (step.kind) {
    case 'question':
      return (
        <div className={cn(styles.line, styles.question)}>
          <span className={styles.prompt}>&gt;</span>
          <span data-text>{step.text}</span>
        </div>
      );
    case 'working':
      return (
        <div className={cn(styles.line, styles.working)}>
          <span className={styles.spinner}>▪</span>
          Working…{' '}
          <span className={styles.readout} data-text>
            {readout(0)}
          </span>
        </div>
      );
    case 'say':
      return (
        <div className={cn(styles.line, styles.say)}>
          <span className={styles.bullet}>●</span>
          {step.text}
        </div>
      );
    case 'tool':
      return (
        <div className={cn(styles.line, styles.tool)}>
          <span className={styles.bullet}>●</span>
          <span className={styles.toolName}>{step.name}</span> (MCP)
          <span className={styles.args}>{step.args}</span>
          <span className={styles.argsElided}>(…)</span>
        </div>
      );
    case 'result':
      return <div className={cn(styles.line, styles.result)}>└─ {step.text}</div>;
    case 'answer':
      return (
        <div className={cn(styles.line, styles.answer)}>
          <span data-text>{step.text}</span>
        </div>
      );
  }
}

/** Plays while on screen; each frame writes to the DOM, and React re-renders only to switch scripts. */
export function AgentTranscript({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  const reduce = useReducedMotion();
  const live = onScreen && !reduce;
  const [script, setScript] = useState(0);
  /** ms into the current script, kept across pauses */
  const elapsed = useRef(0);

  useEffect(() => {
    const body = bodyRef.current;
    if (!live || !body) return;
    const timeline = TIMELINES[script];
    let raf = 0;
    let last: number | undefined;
    const frame = (now: number) => {
      // cap gaps at 1s so a hidden tab resumes where it left off
      elapsed.current += last === undefined ? 0 : Math.min(now - last, 1000);
      last = now;
      if (elapsed.current >= timeline.end) {
        elapsed.current = 0;
        setScript((s) => (s + 1) % SCRIPTS.length);
        return;
      }
      stage(body, timeline, elapsed.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live, script]);

  return (
    <div
      ref={ref}
      className={cn(styles.terminal, className)}
      style={FLARE_FIELD}
      data-live={live || undefined}
      role='img'
      aria-label={COPY.illustrations.transcript}
    >
      <FlareShimmer className={styles.shimmer} live={live} />
      {/* role='img' alone doesn't hide inner text from every screen reader */}
      <div className={styles.bar} aria-hidden>
        <span className={styles.light} />
        <span className={styles.light} />
        <span className={styles.light} />
        <span className={styles.session}>claude — ~/acme-site</span>
        <span className={styles.server}>
          <BrandMark className={styles.mark} />
          betterlytics mcp
        </span>
      </div>
      <div className={styles.screen}>
        {/* hidden finished copies hold the tallest script's height on phones, so printing never shifts the page */}
        {SCRIPTS.map((steps, s) => (
          <div key={s} className={cn(styles.body, styles.reserve)} aria-hidden>
            {steps.map((step, i) => (
              <Line key={i} step={step} />
            ))}
          </div>
        ))}
        <div ref={bodyRef} className={styles.body} aria-hidden>
          {/* keyed so no line keeps the last script's DOM state */}
          <Fragment key={script}>
            {SCRIPTS[script].map((step, i) => (
              <Line key={i} step={step} />
            ))}
          </Fragment>
        </div>
      </div>
    </div>
  );
}
