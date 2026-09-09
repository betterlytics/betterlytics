/**
 * The seven steps of the journey section: the rail copy for each, keyed to the
 * illustration that plays alongside it (see sections/journeySection). Titles
 * are free-standing sentences; the rail morphs the whole headline, so nothing
 * has to share a stem. Copy is hard-coded while the wording is revised.
 */
export type JourneyStep = {
  id: 'find' | 'see' | 'do' | 'follow' | 'wait' | 'errors' | 'reach';
  /** Lines split on `\n`. The first line is set in the dim tone, the rest in the bright one. */
  title: string;
  note: string;
  /** Tools this step stands in for, shown as chips. */
  replaces: readonly string[];
};

export const JOURNEY_STEPS: readonly JourneyStep[] = [
  {
    id: 'find',
    title: 'Where your users\ncome from',
    note: 'Organic search, referrals, campaigns and social — including the growing share arriving from ChatGPT and Perplexity.',
    replaces: ['Google Analytics'],
  },
  {
    id: 'see',
    title: 'What your users\nlook at',
    note: 'Pages, countries, devices and languages — live, and never sampled.',
    replaces: ['Google Analytics'],
  },
  {
    id: 'do',
    title: 'What your users\nactually do',
    note: 'Custom events, conversion funnels and goals you can segment by anything.',
    replaces: ['Mixpanel'],
  },
  {
    id: 'follow',
    title: 'What your users\nstruggled with',
    note: 'Session replay: every click, scroll and rage click, as they saw it.',
    replaces: ['Hotjar'],
  },
  {
    id: 'wait',
    title: 'How long\nyour users wait',
    note: 'LCP, INP and CLS measured on real visits rather than a lab run.',
    replaces: ['SpeedCurve'],
  },
  {
    id: 'errors',
    title: 'What breaks\nfor your users',
    note: 'JavaScript errors with the stack trace, the page, and who they hit.',
    replaces: ['Sentry'],
  },
  {
    id: 'reach',
    title: "When your users\ncan't reach you",
    note: 'Uptime monitors, incidents, SSL expiry and a public status page.',
    replaces: ['Pingdom', 'Statuspage'],
  },
];
