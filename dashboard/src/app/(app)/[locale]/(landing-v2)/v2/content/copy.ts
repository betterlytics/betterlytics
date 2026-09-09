/**
 * All page copy, deliberately hard-coded while the wording is still being
 * revised. Once it settles this moves into the message catalogue.
 *
 * `*word*` marks the emphasised span in a title or quote (see ui/emphasis).
 */
export const COPY = {
  seo: {
    title: 'Betterlytics — Analytics you can actually read',
    description:
      'Privacy-first web analytics. Every pageview, event and funnel on the record — cookieless and never sampled.',
  },
  nav: {
    skip: 'Skip to content',
    home: 'Betterlytics — home',
    menu: 'Menu',
    links: [
      { label: 'Demo', anchor: 'demo' },
      { label: 'Features', anchor: 'journey' },
      { label: 'AI', anchor: 'mcp' },
      { label: 'Pricing', anchor: 'pricing' },
    ],
    docs: 'Docs',
    github: 'Betterlytics on GitHub',
    signIn: 'Sign in',
    cta: 'Start measuring',
    goToDashboard: 'Go to dashboard',
  },
  hero: {
    pill: 'Live · 2.4M events recorded today',
    title: 'Every visit, every error, every outage.',
    lede: 'One script, 4.9 kB. No cookies, no sampling, and nothing left to reconcile between dashboards.',
    ctaPrimary: 'Start measuring',
    ctaDemo: 'See a live dashboard',
  },
  demo: {
    placeholder: 'Interactive demo',
    loading: 'Loading the live dashboard',
    frameTitle: 'Betterlytics live demo',
  },
  customers: {
    label: 'Trusted by *privacy-first* teams',
  },
  journey: {
    title: 'Everything your users *experienced*.',
    lede: 'One script replaces your analytics, your product metrics, your error tracker, your uptime monitor and your status page.',
    replaces: 'replaces',
  },
  mcp: {
    title: 'Point your *own* agent at it.',
    lede: 'Betterlytics ships an MCP server. Connect Claude, Cursor or any MCP client and ask one question that spans traffic, funnels, errors and uptime at once.',
    body: 'No dashboard to learn, no query language. Your agent reads the schema, picks its tools and joins across all of it.',
    worksWith: 'Works with',
    any: 'ChatGPT, Zed, Codex — and any client that speaks the protocol over HTTP.',
    cta: 'Set up MCP',
  },
  frameworks: {
    title: 'Your framework, *unmodified*.',
    lede: 'One script tag, or a package if you prefer. No tag manager, no adapter, and nothing to change about how you already build.',
  },
  network: {
    title: 'One script. Nothing else to add.',
    lede: 'No tag manager, no consent gate, no second SDK to reconcile. Here is exactly what it costs your site.',
    /* Script size is the gzipped static/analytics.js; the other two figures come from the draft. */
    stats: [
      {
        label: 'Script size',
        value: 4.9,
        decimals: 1,
        unit: 'kB',
        body: 'The entire tracker, gzipped. Loads after paint, one request, never blocks a render.',
      },
      {
        label: 'Ingest lag',
        value: 1.4,
        decimals: 1,
        unit: 's',
        body: "From a visitor's click to the number moving on your dashboard. Real time, actually.",
      },
      {
        label: 'Capture rate',
        value: 99.8,
        decimals: 1,
        unit: '%',
        body: 'Of real visits recorded. First-party, so ad blockers never quietly eat your data.',
      },
    ],
    thesis: {
      label: 'Cookies set',
      value: '0',
      body: 'No cookies, no fingerprinting, no consent banner. GDPR and PECR compliant by default, on EU-only infrastructure.',
    },
  },
  quotes: {
    title: 'Teams that stopped guessing.',
  },
  pricing: {
    title: 'You pay for events, not for seats.',
    lede: 'Invite the whole company. Bots, prefetches and blocked requests are filtered before they ever reach your bill.',
    monthlyEvents: 'Monthly events',
    rangeLabel: 'Monthly event volume',
    perMonth: '/month',
    free: 'Free',
    custom: 'Custom',
    growth: {
      name: 'Growth',
      tagline: 'For side projects and small sites.',
      ctaFree: 'Start free',
      cta: 'Start measuring',
    },
    professional: {
      name: 'Professional',
      tagline: 'For teams running several products.',
      cta: 'Start measuring',
      badge: 'Most popular',
    },
    enterprise: {
      name: 'Enterprise',
      tagline: 'For regulated workloads and committed volume.',
      cta: 'Talk to sales',
    },
  },
  cta: {
    title: 'Add one script and watch it land.',
    lede: 'The free tier is the same script, the same dashboard and the same unsampled data the paid plans get. Nothing is held back for the demo.',
    primary: 'Start measuring',
    secondary: 'View docs',
  },
  footer: {
    tagline: 'Privacy-first web analytics for the modern web. GDPR compliant, cookieless, and open source.',
    columns: {
      company: 'Company',
      resources: 'Resources',
      compare: 'Compare',
      connect: 'Connect',
    },
    company: {
      about: 'About',
      contact: 'Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      dpa: 'Data Processing Agreement',
      subprocessors: 'Subprocessors',
    },
    resources: {
      docs: 'Documentation',
      changelog: 'Changelog',
      features: 'Features',
      pricing: 'Pricing',
      status: 'Status',
    },
    compare: [
      { slug: 'google-analytics', name: 'Google Analytics' },
      { slug: 'matomo', name: 'Matomo' },
      { slug: 'plausible', name: 'Plausible' },
      { slug: 'posthog', name: 'PostHog' },
      { slug: 'fathom-analytics', name: 'Fathom Analytics' },
      { slug: 'umami', name: 'Umami' },
    ],
    connect: { github: 'GitHub', bluesky: 'Bluesky', discord: 'Discord' },
    copyright: (year: number) => `© ${year} Betterlytics. Open source under AGPL-3.0 license.`,
    legal: 'Legal',
    privacy: 'Privacy',
    terms: 'Terms',
    subprocessors: 'Subprocessors',
    reportVulnerability: 'Report a vulnerability',
  },
} as const;
