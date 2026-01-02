import { ComparisonLocaleContent } from '../..';

export const fathom: ComparisonLocaleContent = {
  name: 'Fathom Analytics',
  logo: '/tools/fathom_analytics-logo.svg',
  hero: {
    title: 'Looking for a Fathom Analytics Alternative?',
    titleHighlight: 'Alternative',
    subtitle:
      'Get the same privacy-first analytics, plus session replay, funnels, and user journey tracking. More insights at a lower price.',
  },
  keyDifferentiators: [
    {
      title: 'Session Replay Included',
      betterlytics: 'Watch real user sessions to understand behavior and identify issues.',
      competitor: 'No session replay. Limited to aggregate analytics.',
    },
    {
      title: 'Funnel & Journey Analysis',
      betterlytics: 'Multi-step funnels and user journey tracking to understand conversion paths.',
      competitor: 'No funnel or journey analysis. Basic event tracking only',
    },
    {
      title: 'Lower Starting Price',
      betterlytics: 'Starts at $6/month with a free tier for smaller sites.',
      competitor: 'Starts at $15/month. No free tier.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy & Compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: true },
          { name: 'GDPR-ready by default', betterlytics: true, competitor: true },
          { name: 'No cookie banner needed', betterlytics: true, competitor: true },
          { name: 'EU data hosting', betterlytics: true, competitor: 'Optional' },
          { name: 'Privacy-first by default', betterlytics: true, competitor: true },
          { name: 'No cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: false },
          { name: 'Self-hosting option', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Performance & Speed',
        features: [
          { name: 'Script size', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Page load impact', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Works with ad blockers', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analytics Features',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Outbound link tracking', betterlytics: true, competitor: true },
          { name: 'Funnel analysis', betterlytics: true, competitor: false },
          { name: 'User journey tracking', betterlytics: true, competitor: false },
          { name: 'Annotations', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'GA data import', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Ease of Use',
        features: [
          { name: 'Setup time', betterlytics: '<5 minutes', competitor: '<5 minutes' },
          { name: 'Learning curve', betterlytics: 'Gentle', competitor: 'Gentle' },
          { name: 'Simple, intuitive interface', betterlytics: true, competitor: true },
          { name: 'Data retention', betterlytics: 'Up to 5 years', competitor: 'Forever' },
        ],
      },
      {
        name: 'Pricing & Support',
        features: [
          { name: 'Free tier available', betterlytics: true, competitor: false },
          { name: 'Starting price', betterlytics: 'From $6/month', competitor: 'From $15/month' },
          { name: 'Transparent pricing', betterlytics: true, competitor: true },
          { name: 'Email support', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Same Privacy Philosophy',
      content: `Fathom and Betterlytics share the same DNA: privacy-first, lightweight, no cookie banners needed. Both are cookieless and designed to be GDPR-ready by default. Moving away from Google Analytics? Either works.\n\nThe difference is depth. We include session replay, funnel analysis, and user journey tracking. Not just what happened, but how and why users behave the way they do.`,
      icon: 'shield',
    },
    {
      title: 'Beyond Aggregate Numbers',
      content: `Fathom shows pageviews, referrers, and basic events. Clean and simple. But when you need to know why users drop off or how they actually use your site, you're stuck with numbers.\n\nBetterlytics includes session replay to watch real user sessions, funnels to track conversion paths, and journey visualization to see how visitors navigate. Problems and opportunities that numbers alone can't reveal.`,
      icon: 'eye',
    },
    {
      title: 'Price vs Value',
      content: `Fathom starts at $15/month for 100,000 pageviews. No free tier, with payment required to get started.\n\nBetterlytics starts at $6/month, nearly 60% less, with a free tier for smaller sites. You get more features (session replay, funnels, journeys) at a lower price. Both have transparent pricing.`,
      icon: 'dollar',
    },
    {
      title: 'Where Fathom Wins',
      content: `Fathom has forever data retention (we keep up to 5 years), a GA4 importer for migrating historical data, and custom domains to reduce ad blocker interference. They've been around longer with a proven track record.\n\nBut if you want session replay, funnels, user journeys, and more, at a lower price with a free tier to start, we offer better value.`,
      icon: 'target',
    },
  ],
};
