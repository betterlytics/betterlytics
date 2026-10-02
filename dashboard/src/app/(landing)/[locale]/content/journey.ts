export type JourneyStep = {
  id: 'find' | 'see' | 'do' | 'follow' | 'wait' | 'errors' | 'reach';
  /** Split on `\n`: the first line (the part repeated across steps) is dim, the rest bright. */
  title: string;
  note: string;
};

export const JOURNEY_STEPS: readonly JourneyStep[] = [
  {
    id: 'find',
    title: 'Where your users\ncome from',
    note: 'Search, referrals, campaigns and social, including ChatGPT and Perplexity.',
  },
  {
    id: 'see',
    title: 'What your users\nlook at',
    note: 'Every page they open, with the country, device and language behind each visit. Live and unsampled.',
  },
  {
    id: 'do',
    title: 'What your users\nactually do',
    note: 'Custom events like signups and purchases, plus funnels that show where people drop off.',
  },
  {
    id: 'follow',
    title: 'What your users\nstruggle with',
    note: 'Session replay: every click, scroll and rage click, as they saw it.',
  },
  {
    id: 'wait',
    title: 'When your users\nwait too long',
    note: "Core Web Vitals (LCP, INP and CLS) measured in your visitors' real browsers.",
  },
  {
    id: 'errors',
    title: 'When your users\nhit an error',
    note: 'JavaScript errors with the stack trace, the page, and a replay of the session that hit it.',
  },
  {
    id: 'reach',
    title: "When your users\ncan't reach you",
    note: 'Uptime monitors, incidents, SSL expiry and a public status page.',
  },
];
