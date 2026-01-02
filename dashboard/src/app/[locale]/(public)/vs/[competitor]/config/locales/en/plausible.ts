import { ComparisonLocaleContent } from '../..';

export const plausible: ComparisonLocaleContent = {
  name: 'Plausible',
  logo: '/tools/plausible-logo.png',
  hero: {
    title: 'Looking for a Plausible Alternative?',
    titleHighlight: 'Alternative',
    subtitle:
      'Everything Plausible offers, plus session replay, user journeys, monitoring, and more. Same privacy-first approach, deeper insights.',
  },
  keyDifferentiators: [
    {
      title: 'Session Replay Included',
      betterlytics: 'Watch real user sessions to understand behavior and fix issues.',
      competitor: 'No session replay. Privacy-focused, but limits behavioral insights.',
    },
    {
      title: 'User Journey Tracking',
      betterlytics: 'Visualize how users navigate through your site page by page.',
      competitor: 'Funnel analysis only. No individual user journey visualization.',
    },
    {
      title: 'Built-in Monitoring',
      betterlytics: 'Uptime monitoring and performance tracking included.',
      competitor: 'Analytics only. Monitoring requires separate tools.',
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
          { name: 'EU data hosting', betterlytics: true, competitor: true },
          { name: 'Privacy-first by default', betterlytics: true, competitor: true },
          { name: 'No cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & Speed',
        features: [
          { name: 'Script size', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Page load impact', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Works with ad blockers', betterlytics: true, competitor: 'Partial' },
        ],
      },
      {
        name: 'Analytics Features',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Funnel analysis', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Outbound link tracking', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: false },
          { name: 'Annotations', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Ease of Use',
        features: [
          { name: 'Setup time', betterlytics: '<5 minutes', competitor: '<5 minutes' },
          { name: 'Learning curve', betterlytics: 'Gentle', competitor: 'Gentle' },
          { name: 'Simple, intuitive interface', betterlytics: true, competitor: true },
          { name: 'No complex configuration', betterlytics: true, competitor: true },
          { name: 'Data retention', betterlytics: 'Up to 5 years', competitor: 'Unlimited' },
        ],
      },
      {
        name: 'Pricing & Support',
        features: [
          { name: 'Free tier available', betterlytics: true, competitor: false },
          { name: 'Transparent pricing', betterlytics: true, competitor: true },
          { name: 'Self-hosting option', betterlytics: true, competitor: true },
          { name: 'Email support', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Same Values, Different Toolsets',
      content: `Plausible and Betterlytics share the same DNA: privacy-first, lightweight, no cookies, GDPR-ready out of the box. Both are great alternatives to Google Analytics if privacy matters to you.\n\nThe difference? Betterlytics includes session replay, user journey tracking, and monitoring. Plausible keeps things minimal on purpose. If you need behavioral insights beyond pageviews and conversions, we've got you covered.`,
      icon: 'shield',
    },
    {
      title: 'Privacy-Safe Session Replay',
      content: `Plausible skips session replay entirely to stay maximally private. Fair choice. But it means you can't see where users click, where they get stuck, or why they leave.\n\nWe include session replay while staying cookieless and privacy-compliant. No cross-site tracking, you control what gets recorded. The behavioral insights you need with strong privacy safeguards.`,
      icon: 'eye',
    },
    {
      title: 'One Tool Instead of Three',
      content: `Plausible does core analytics really well: pageviews, referrers, conversions, funnels. Clean and focused. But when you need uptime monitoring or performance tracking, you're adding more tools.\n\nBetterlytics bundles analytics, session replay, user journeys, and monitoring in one place. One dashboard, one bill, same privacy standards across everything.`,
      icon: 'layers',
    },
    {
      title: 'Pricing Breakdown',
      content: `Plausible starts at $9/month for 10,000 pageviews. No free tier on hosted, though self-hosting is free if you handle the infrastructure.\n\nBetterlytics starts at $6/month with a free tier for smaller sites. You get session replay, monitoring, user journeys included. More features, lower starting price.`,
      icon: 'dollar',
    },
    {
      title: 'Where Plausible Wins',
      content: `Plausible is fully open source, you can audit every line of code. Self-hosting gives you complete data control. Their script is slightly smaller on average.\n\nIf open source and self-hosting are non-negotiable, Plausible is excellent. But if you want more features with managed hosting and simpler pricing, Betterlytics delivers more value.`,
      icon: 'target',
    },
  ],
};
