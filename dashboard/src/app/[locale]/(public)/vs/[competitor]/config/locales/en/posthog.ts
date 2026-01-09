import { ComparisonLocaleContent } from '../..';

export const posthog: ComparisonLocaleContent = {
  name: 'PostHog',
  logo: '/tools/posthog-logo.svg',
  seo: {
    title: 'Betterlytics vs PostHog: Focused, Lightweight Alternative',
    description:
      'Compare Betterlytics to PostHog. Get focused web analytics with a tiny script, privacy by default, and predictable pricing. No complexity, just clarity.',
    keywords: [
      'PostHog alternative',
      'lightweight analytics',
      'privacy-first analytics',
      'simple web analytics',
      'cookieless analytics',
      'PostHog replacement',
      'predictable pricing analytics',
    ],
  },
  hero: {
    title: 'Looking for a PostHog Alternative?',
    titleHighlight: 'Alternative',
    subtitle:
      'Betterlytics gives you focused, lightweight web analytics with simple pricing and a minimal footprint; for teams who want clarity, not complexity.',
  },
  keyDifferentiators: [
    {
      title: 'Truly Lightweight',
      betterlytics: '<2KB script. Designed for minimal page performance impact.',
      competitor: '~57KB script with a broad feature set and higher load overhead.',
    },
    {
      title: 'Privacy by Default',
      betterlytics: 'Cookieless by design. No cookie banners needed.',
      competitor: 'Uses cookies by default. Cookieless mode is available with configuration.',
    },
    {
      title: 'Simple, Predictable Pricing',
      betterlytics: 'Free forever for small sites. Paid plans from $6/month with core features included.',
      competitor:
        'Generous free tier, but usage-based billing across multiple products gets complex as you scale.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy & Compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: 'Optional' },
          { name: 'GDPR-ready by default', betterlytics: true, competitor: 'With config' },
          { name: 'No cookie banner needed', betterlytics: true, competitor: 'Depends on setup' },
          { name: 'EU data hosting', betterlytics: true, competitor: 'Optional' },
          { name: 'Privacy-first by default', betterlytics: true, competitor: false },
          { name: 'No cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Full data ownership', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Self-hosting option', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & Speed',
        features: [
          { name: 'Script size', betterlytics: '<2KB', competitor: '~57KB' },
          { name: 'Page load impact', betterlytics: 'Minimal', competitor: 'Moderate' },
          { name: 'Works with ad blockers', betterlytics: true, competitor: 'Partial' },
        ],
      },
      {
        name: 'Analytics Features',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Funnel analysis', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: true },
          { name: 'Core Web Vitals', betterlytics: true, competitor: true },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Feature flags', betterlytics: false, competitor: true },
          { name: 'A/B testing', betterlytics: false, competitor: true },
          { name: 'Surveys (NPS/CSAT)', betterlytics: false, competitor: true },
          { name: 'Heatmaps', betterlytics: false, competitor: true },
          { name: 'Mobile app analytics', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Ease of Use',
        features: [
          { name: 'Setup time', betterlytics: '<5 minutes', competitor: 'Longer initial setup' },
          { name: 'Learning curve', betterlytics: 'Gentle', competitor: 'Moderate' },
          { name: 'Simple, analytics-focused interface', betterlytics: true, competitor: false },
          { name: 'Minimal configuration required', betterlytics: true, competitor: false },
          { name: 'Data retention', betterlytics: 'Up to 5 years', competitor: 'Up to 7 years' },
        ],
      },
      {
        name: 'Pricing & Support',
        features: [
          { name: 'Free tier available', betterlytics: true, competitor: true },
          { name: 'Predictable pricing', betterlytics: true, competitor: false },
          { name: 'Email support', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Focused vs All-in-One',
      content: `PostHog packs a lot into one platform: product analytics, feature flags, A/B testing, session replay, surveys, and more. Great for large product teams who need it all. But if you just want web analytics? You may end up paying for features you don't need.\n\nBetterlytics does analytics and does it well. Session replay, funnels, user journeys, performance monitoring. You're up and running in 5 minutes; no PhD in product analytics required.`,
      icon: 'target',
    },
    {
      title: 'Page Speed Matters',
      content: `PostHog's script is around 57KB gzipped. That includes support for feature flags, session recording, autocapture, and other product features. On mobile or slower connections, that adds up.\n\nOur script? Under 2KB. Your pages stay fast, Core Web Vitals stay green, and SEO stays happy. Analytics shouldn't slow your site down.`,
      icon: 'zap',
    },
    {
      title: 'Privacy Out of the Box',
      content: `PostHog uses cookies by default. You can configure cookieless mode, but that's extra setup and may limit some features. Default mode? In many cases, this means a consent banner is required for GDPR compliance.\n\nBetterlytics is cookieless from the start. No configuration, no cookie banners, no annoying popups for your visitors.`,
      icon: 'shield',
    },
    {
      title: 'Know What You Pay',
      content: `PostHog bills separately for events, session recordings, feature flags, surveys, and more. Their free tier is generous, but costs can spike as you scale. This can make monthly costs harder to predict as usage grows.\n\nWe keep it simple: flat pricing from $6/month with clear event limits. Session replay, monitoring, and core analytics included. No spreadsheet required to figure out what you owe.`,
      icon: 'dollar',
    },
    {
      title: 'Where PostHog Wins',
      content: `Credit where it's due: PostHog nails feature flags, A/B testing, and product experimentation. If you're running experiments and need granular feature control, it's hard to beat.\n\nBut if you want clean web analytics with session replay and uptime monitoring, without learning a whole new platform, that's where we come in. We do analytics really well. PostHog does a lot of things pretty well.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Keep It Simple',
    title: 'Want Analytics Without the Overhead?',
    subtitle: 'Focused web analytics. Lightweight script. Predictable pricing.',
    buttonText: 'Start Free Trial',
  },
};
