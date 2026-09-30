'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { COPY } from '@/landing/content/copy';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import styles from './agentTranscript.module.css';
import { FlareShimmer } from './flareShimmer';

/* The transcript is mock terminal output, kept literal on purpose. Each question
   deliberately needs two parts of the product at once (traffic and errors,
   uptime and sales, acquisition and signups), which is impossible unless they
   live in the same tool. Tool names and inputs are the MCP server's real ones
   (src/mcp/tools/describe.ts). */
type Step =
  | { kind: 'question'; text: string }
  | { kind: 'working'; ms: number }
  | { kind: 'say'; text: string }
  | { kind: 'tool'; name: string; args: string }
  | { kind: 'result'; text: string }
  | { kind: 'answer'; text: string };

/** Played in order and looped. The first is the one most visitors see, and the one standing at rest. */
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

/** The terminal's pace, in ms. */
const PACE = {
  /** per character typed: the question at a typist's speed, the answer streamed faster */
  question: 26,
  answer: 17,
  /** the beat after the question before the agent starts working */
  afterQuestion: 380,
  /** how long each printed line stands before the next */
  say: 700,
  tool: 620,
  result: 560,
  /** the finished answer stays up this long, then the transcript fades before the next question */
  read: 5200,
  fade: 420,
} as const;

/** A line of a script and when it is on screen, in ms from the script's start. */
type Cue = { step: Step; from: number; to: number };

/** A script laid out in time, in ms from its start. */
type Timeline = {
  cues: Cue[];
  /** the answer has typed out and the cursor settles after it */
  done: number;
  /** the transcript fades out */
  out: number;
  /** the next question starts */
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
        // each character, a beat after the last, then the pause before the agent starts
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
        // the working indicator gives way to the answer
        if (working) working.to = t;
        t += (step.text.length + 1) * PACE.answer;
        break;
    }
    cues.push(cue);
  }
  return { cues, done: t, out: t + PACE.read, end: t + PACE.read + PACE.fade };
}

const TIMELINES = SCRIPTS.map(toTimeline);

/** The working indicator's readout after `seconds`, in the shape Claude Code prints it. */
const readout = (seconds: number) =>
  `(${seconds}s · ↓ ${(0.4 + seconds * 0.32).toFixed(1)}k tokens · esc to interrupt)`;

/** What a line's live part reads `elapsed` ms after it printed: the text typed so far, or the working readout. */
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

/**
 * Sets the transcript's lines to how they stand `t` ms into their script: which have
 * printed, and how far the live parts have got. Writes to the DOM only what changed.
 */
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

/**
 * One step as the terminal prints it, finished. `data-text` marks its live part, which
 * `stage` rewrites while it plays; React renders a script's lines once and never
 * updates them, so the two never write the same text.
 */
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
          {step.args}
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

/**
 * An agent transcript in the shape an MCP client actually prints one: a prompt, a
 * working indicator, tool calls with their arguments and returned rows, then the
 * answer. The markup is the first script's finished transcript, the whole picture
 * without JavaScript or under reduced motion. Otherwise it plays while on screen,
 * holds where it is while scrolled away, and loops through the scripts; each frame
 * writes the lines' state to the DOM, and React renders only to change scripts.
 * Screen readers get a summary instead of a moving transcript.
 */
export function AgentTranscript({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  const reduce = useReducedMotion();
  const live = onScreen && !reduce;
  const [script, setScript] = useState(0);
  /** how far into the current script it has played; survives pauses */
  const elapsed = useRef(0);

  useEffect(() => {
    const body = bodyRef.current;
    if (!live || !body) return;
    const timeline = TIMELINES[script];
    let raf = 0;
    let last: number | undefined;
    const frame = (now: number) => {
      // a hidden tab gets no frames; counting at most a second of any gap resumes it where it left off
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
      data-live={live || undefined}
      role='img'
      aria-label={COPY.illustrations.transcript}
    >
      <FlareShimmer className={styles.shimmer} live={live} />
      {/* the label speaks for the art: role='img' alone doesn't hide the text inside from every screen reader */}
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
      <div ref={bodyRef} className={styles.body} aria-hidden>
        {/* a new script is a fresh set of lines, so none keeps the last one's state */}
        <Fragment key={script}>
          {SCRIPTS[script].map((step, i) => (
            <Line key={i} step={step} />
          ))}
        </Fragment>
      </div>
    </div>
  );
}
