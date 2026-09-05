/**
 * The seven steps of the journey section: the rail copy for each, keyed to the
 * illustration that plays alongside it (see sections/journeySection).
 * Copy is hard-coded while the wording is revised.
 */
export type JourneyStep = {
  id: 'find' | 'see' | 'do' | 'follow' | 'wait' | 'errors' | 'reach';
  /** Completes the stem "What your users …" */
  word: string;
  note: string;
  replaces: string;
};

export const JOURNEY_STEPS: readonly JourneyStep[] = [
  {
    id: 'find',
    word: 'find you through',
    note: 'Organic search, referrals, campaigns and social — including the growing share arriving from ChatGPT and Perplexity.',
    replaces: 'Replaces Google Analytics + UTM spreadsheets.',
  },
  {
    id: 'see',
    word: 'see',
    note: 'Pages, countries, devices and languages — live, and never sampled.',
    replaces: 'Replaces Google Analytics.',
  },
  {
    id: 'do',
    word: 'do',
    note: 'Custom events, conversion funnels and goals you can segment by anything.',
    replaces: 'Replaces Mixpanel.',
  },
  {
    id: 'follow',
    word: 'follow',
    note: 'Entry page, every step in between, and the page they left from.',
    replaces: 'Replaces Hotjar.',
  },
  {
    id: 'wait',
    word: 'wait for',
    note: 'LCP, INP and CLS measured on real visits rather than a lab run.',
    replaces: 'Replaces SpeedCurve.',
  },
  {
    id: 'errors',
    word: 'run into',
    note: 'JavaScript errors with the stack trace, the page, and who they hit.',
    replaces: 'Replaces Sentry.',
  },
  {
    id: 'reach',
    word: "can't reach",
    note: 'Uptime monitors, incidents, SSL expiry and a public status page.',
    replaces: 'Replaces Pingdom and Statuspage.',
  },
];
