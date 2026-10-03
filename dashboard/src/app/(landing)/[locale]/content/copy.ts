/**
 * Hard-coded until the wording settles, then moves to the message catalogue.
 * `*word*` marks the emphasised span. `\n` forces a title's phone line break
 * where balancing would break it worse (see ui/emphasis).
 */

/** The copy's language under every URL locale; the page's `lang` and number formats follow it. */
export const COPY_LOCALE = 'en';

export const COPY = {
  seo: {
    title: 'Betterlytics: Web analytics, session replay, errors & uptime',
    description:
      'See your website traffic, session replays, errors, Core Web Vitals and uptime in one dashboard. Open source and cookieless, with a free plan.',
    /* link previews in chats and social posts; the hero's own words */
    socialTitle: "You shouldn't need five tools to understand one website",
    socialDescription:
      'Cookieless analytics, session replay, Core Web Vitals, errors and uptime. One dashboard, one bill.',
  },
  nav: {
    skip: 'Skip to content',
    home: 'Betterlytics — home',
    menu: 'Menu',
    label: 'Primary',
    links: [
      { label: 'Demo', href: '/demo' },
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
    docs: 'Docs',
    github: 'GitHub',
    githubLabel: 'Betterlytics on GitHub',
    signIn: 'Sign in',
    cta: 'Get started',
    goToDashboard: 'Go to dashboard',
  },
  hero: {
    title: "You shouldn't need five tools to understand one website",
    lede: 'Cookieless analytics, session replay, Core Web Vitals, errors and uptime. One dashboard, one bill.',
    ctaPrimary: 'Get started free',
  },
  demo: {
    placeholder: 'Interactive demo',
    loading: 'Loading the live dashboard',
    frameTitle: 'Betterlytics live demo',
    urlHost: 'betterlytics.io',
    urlPath: '/demo',
    newTab: '(opens in a new tab)',
    stalled: 'Open the live demo',
    activateLine: 'Click anywhere to explore',
    /* must start with activateLine, so voice-control users can say what they see */
    activateAria: 'Click anywhere to explore the interactive demo dashboard',
  },
  customers: {
    label: 'Used by teams at',
  },
  journey: {
    title: 'Everything your users *experienced*',
    lede: 'From their first visit to your next outage.',
  },
  mcp: {
    /* "Point your own" fits down to 360px */
    title: 'Point your *own*\nagent at it',
    lede: 'An MCP server is built in. Ask in plain language, get answers across all of it.',
    lead: 'Ask questions, not queries.',
    body: 'Your agent reads the schema and joins across traffic, funnels, errors and uptime.',
    worksWith: 'Works with',
    any: 'ChatGPT, Zed, JetBrains — and any client that speaks the protocol over HTTP.',
    cta: 'Set up MCP',
  },
  /* text alternatives for the aria-hidden illustrations; update with the art */
  illustrations: {
    globe:
      'A turning globe marking where visitors arrive from, each city called out with the source that sent them, such as Copenhagen via ChatGPT.',
    /* only the heatmap: the card's tables are real text */
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
    /* the MCP terminal's first script, shown at rest */
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
    snippetLabel: 'Install snippet',
    /* script size is the gzipped static/analytics.js; the other figures come from the draft */
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
  pricing: {
    title: 'One price, scaled by your traffic',
    lede: "Bots we catch don't count, and a traffic spike never costs extra.",
    monthlyEvents: 'Monthly events',
    rangeLabel: 'Monthly event volume',
    rangeValueText: (events: string) => `${events} events`,
    perMonth: '/month',
    free: 'Free',
    custom: 'Custom',
    growth: {
      name: 'Growth',
      tagline: 'For side projects and small sites.',
      ctaFree: 'Get started free',
      cta: 'Get started',
    },
    professional: {
      name: 'Professional',
      tagline: 'For teams running several products.',
      cta: 'Get started',
      badge: 'Most popular',
    },
    enterprise: {
      name: 'Enterprise',
      tagline: 'For regulated workloads and committed volume.',
      cta: 'Talk to sales',
    },
  },
  cta: {
    title: 'Add one script and watch your first visitor arrive',
    lede: 'The free tier is the same script, dashboard and unsampled data as every paid plan. No credit card required.',
    primary: 'Get started free',
    secondary: 'View docs',
  },
  footer: {
    tagline:
      'Web analytics, session replay, errors and uptime in one open-source tool. Cookieless and hosted in the EU.',
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
    /* slugs without a /vs page are dropped */
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
    license: { lead: 'Open source under', name: 'AGPL-3.0', tail: 'license.' },
    reportVulnerability: 'Report a vulnerability',
  },
} as const;
