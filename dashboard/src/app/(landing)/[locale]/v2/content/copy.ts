/**
 * All page copy, deliberately hard-coded while the wording is still being
 * revised. Once it settles this moves into the message catalogue.
 *
 * `*word*` marks the emphasised span in a title or quote, and `\n` in a title where it
 * breaks on phones, when balancing would break it worse (see ui/emphasis).
 */

/** The language the copy is written in, whatever the URL's locale: the page's `lang` and its number formats follow it. */
export const COPY_LOCALE = 'en';

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
    label: 'Primary',
    /* pages, not this page's sections: the bar is the site's navigation, on every page it shows on */
    links: [
      { label: 'Demo', href: '/demo' },
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
    docs: 'Docs',
    github: 'GitHub',
    /* the bar's GitHub button, which shows only the mark */
    githubLabel: 'Betterlytics on GitHub',
    signIn: 'Sign in',
    cta: 'Start measuring',
    goToDashboard: 'Go to dashboard',
  },
  hero: {
    title: 'Every visit, every error, every outage',
    lede: 'One script, 4.9 kB. No cookies, no sampling, and nothing left to reconcile between dashboards.',
    ctaPrimary: 'Start measuring for free',
  },
  demo: {
    placeholder: 'Interactive demo',
    loading: 'Loading the live dashboard',
    frameTitle: 'Betterlytics live demo',
    /* the frame's title bar: a stub address bar beside the window dots */
    urlHost: 'betterlytics.io',
    urlPath: '/demo',
    /* The scrim's only line. It names the mechanic, which nothing else says —
       the chrome above already carries "demo", so repeating that here would be
       the frame talking to itself. */
    activateLine: 'Click anywhere to explore',
    /* starts with the visible line, so voice control users can say what they see */
    activateAria: 'Click anywhere to explore the interactive demo dashboard',
  },
  customers: {
    label: 'Trusted by *fast-growing* startups',
  },
  journey: {
    title: 'Everything your users *experienced*',
    lede: 'From the first visit to the outage, in one dashboard.',
  },
  mcp: {
    /* on phones the line ends on the emphasised word; "Point your own" fits even at 360px */
    title: 'Point your *own*\nagent at it',
    lede: 'An MCP server is built in. Ask in plain language, get answers across all of it.',
    /* the lead is a small heading on its own line, the column's only primary-tone text */
    lead: 'Ask questions, not queries.',
    body: 'Your agent reads the schema and joins across traffic, funnels, errors and uptime.',
    worksWith: 'Works with',
    any: 'ChatGPT, Zed, JetBrains — and any client that speaks the protocol over HTTP.',
    cta: 'Set up MCP',
  },
  /* What each illustration shows, in words, for readers who can't see it: the art itself is
     hidden from assistive tech. Change one with its illustration. */
  illustrations: {
    globe:
      'A turning globe marking where visitors arrive from, each city called out with the source that sent them, such as Copenhagen via ChatGPT.',
    /* the traffic card's tables are real text; only its weekly heatmap needs words */
    traffic:
      'Visitors by weekday and hour: busiest in weekday office hours, with a smaller evening peak and quieter weekends.',
    events:
      "A live log of custom events such as signups and purchases, each with the property it was sent with and the visitor's country, browser and device.",
    replay:
      'A replay of a visitor on a pricing page: they click Choose Pro, a TypeError is thrown, they rage-click the button four times, then leave.',
    vitals: 'Gauges for FCP, TTFB, LCP, INP and CLS, each graded good, needs work or poor.',
    errors:
      'A TypeError firing now, with the page and click that led to it, its stack trace and who it hit; behind it, a quieter error and a resolved one.',
    uptime:
      'Four uptime monitors with their recent checks. When one stops responding, the alert goes out to Slack, Discord and email, and the public status page reports the outage.',
    /* the MCP terminal's first script, which is what it shows at rest */
    transcript:
      'A terminal session: asked which pages lost traffic after the August redesign, an agent queries pageviews and errors through the Betterlytics MCP server and finds /pricing down 34%, hit by a TypeError shipped the same day.',
  },
  frameworks: {
    title: 'Your framework, *unmodified*',
    lede: 'One script tag, or a package if you prefer. Nothing else changes.',
  },
  network: {
    title: 'One script, nothing else to add',
    lede: 'Here is exactly what it costs your site.',
    /* names the snippet's framework tabs for screen readers */
    snippetLabel: 'Install snippet',
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
      body: 'No cookies, no fingerprinting, no consent banner. GDPR, ePrivacy and PECR compliant by default, on EU-only infrastructure.',
    },
  },
  quotes: {
    title: 'Teams that stopped guessing',
    lede: 'In their own words, what changed after the switch.',
    marquee: 'Testimonials',
  },
  pricing: {
    title: 'One price, scaled by your traffic',
    lede: 'Events are the only meter. Bots we catch are dropped before they count.',
    monthlyEvents: 'Monthly events',
    rangeLabel: 'Monthly event volume',
    rangeValueText: (events: string) => `${events} events`,
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
    title: 'Add one script and watch it land',
    lede: 'The free tier is the same script, dashboard and unsampled data as every paid plan. No credit card required.',
    primary: 'Start measuring for free',
    secondary: 'View docs',
  },
  footer: {
    tagline:
      'Privacy-first web analytics for the modern web. GDPR, CCPA and PECR compliant, cookieless, and open source.',
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
    /* each slug is a /vs page; one without a page is left out rather than linked */
    compare: [
      { slug: 'google-analytics', name: 'Google Analytics' },
      { slug: 'matomo', name: 'Matomo' },
      { slug: 'plausible', name: 'Plausible' },
      { slug: 'posthog', name: 'PostHog' },
      { slug: 'fathom-analytics', name: 'Fathom Analytics' },
      { slug: 'umami', name: 'Umami' },
    ],
    compareLink: (name: string) => `vs ${name}`,
    connect: { github: 'GitHub', bluesky: 'Bluesky', discord: 'Discord' },
    nav: 'Footer',
    copyright: (year: number) => `© ${year} Betterlytics.`,
    /* the licence's name links to its text */
    license: { lead: 'Open source under', name: 'AGPL-3.0', tail: 'license.' },
    reportVulnerability: 'Report a vulnerability',
  },
} as const;
