import { ComparisonLocaleContent } from '../..';

export const matomo: ComparisonLocaleContent = {
  name: 'Matomo Cloud',
  logo: '/tools/matomo-logo.svg',
  hero: {
    title: 'Looking for a Matomo Alternative?',
    titleHighlight: 'Alternative',
    subtitle:
      'Get modern, lightweight analytics without the complexity. No server management, no plugin headaches.',
  },
  keyDifferentiators: [
    {
      title: 'Modern Architecture',
      betterlytics: "Built from scratch for today's web. Session replay and monitoring included by default.",
      competitor: 'Started in 2007 as Piwik. Mature platform with many features delivered via plugins.',
    },
    {
      title: 'No Plugins Needed',
      betterlytics: 'Analytics, session replay, and monitoring included. One tool, one price.',
      competitor: 'Core analytics free, but session recording and heatmaps require paid add-ons.',
    },
    {
      title: 'Simple Pricing',
      betterlytics: 'Free tier available. Paid plans from $6/month, everything included.',
      competitor:
        'Self-hosted has infrastructure and maintenance costs. Cloud plans start higher with paid add-ons.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy & Compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: 'Optional' },
          { name: 'GDPR-ready by default', betterlytics: true, competitor: 'With config' },
          { name: 'No cookie banner needed', betterlytics: true, competitor: 'With config' },
          { name: 'EU data hosting', betterlytics: true, competitor: 'Optional' },
          { name: 'Privacy-first by default', betterlytics: true, competitor: 'Optional' },
          { name: 'No cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Full data ownership', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Self-hosting option', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & Speed',
        features: [
          { name: 'Script size', betterlytics: '<2KB', competitor: '~23KB' },
          { name: 'Page load impact', betterlytics: 'Minimal', competitor: 'Moderate' },
          { name: 'Works with ad blockers', betterlytics: true, competitor: 'Limited' },
        ],
      },
      {
        name: 'Analytics Features',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: 'Limited' },
          { name: 'Funnel analysis', betterlytics: true, competitor: 'With add-on' },
          { name: 'Session replay', betterlytics: true, competitor: 'With add-on' },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Ease of Use',
        features: [
          { name: 'Setup time', betterlytics: '<5 minutes', competitor: '<5 minutes' },
          { name: 'Learning curve', betterlytics: 'Gentle', competitor: 'Moderate' },
          { name: 'Simple, intuitive interface', betterlytics: true, competitor: false },
          { name: 'No complex configuration', betterlytics: true, competitor: false },
          { name: 'Data retention', betterlytics: 'Up to 5 years', competitor: 'Up to 2 years' },
        ],
      },
      {
        name: 'Pricing & Support',
        features: [
          { name: 'Free tier available', betterlytics: true, competitor: false },
          { name: 'Transparent pricing', betterlytics: true, competitor: 'Limited' },
          { name: 'Email support', betterlytics: true, competitor: 'Paid' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: "Built for Today's Web",
      content: `Matomo started as Piwik in 2007, when the web was a different place. It's matured over the years, but carries legacy architecture. Features were added over time, sometimes as plugins, sometimes built-in.\n\nBetterlytics was designed from scratch for the modern web. Lightweight by default, session replay standard, Core Web Vitals-friendly. No legacy baggage, just clean analytics built for how the web works today.`,
      icon: 'sparkles',
    },
    {
      title: 'Privacy Without Configuration',
      content: `Matomo can be configured for cookieless tracking and GDPR compliance. It's solid once set up. But getting there takes work, and maintaining compliance requires ongoing attention.\n\nBetterlytics is privacy-first out of the box. Cookieless by default, GDPR-ready without configuration, EU-hosted data. You get the privacy benefits without reading configuration docs.`,
      icon: 'shield',
    },
    {
      title: 'Real Cost of "Free"',
      content: `Matomo's self-hosted version is free to download, but you're paying for servers, maintenance time, and premium plugins like session recording. Matomo Cloud starts at $19/month and scales with pageviews.\n\nBetterlytics has a free tier for small sites. Paid plans start at $6/month with everything included: session replay, monitoring, no add-on fees. What you see is what you pay.`,
      icon: 'dollar',
    },
    {
      title: 'Everything in One Place',
      content: `Matomo has comprehensive analytics, but session recording is a paid plugin and there's no uptime monitoring. The interface is powerful but can feel overwhelming.\n\nBetterlytics bundles analytics, session replay, uptime monitoring, and performance tracking together. One clean interface, no plugins to buy, no paywalls on paid plans.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Simplify Your Stack',
    title: 'Ready for Analytics Without the Complexity?',
    subtitle: 'No plugins. No server maintenance. Just clean analytics that works.',
    buttonText: 'Start Free Trial',
  },
};
