import { ComparisonLocaleContent } from '../..';

export const umami: ComparisonLocaleContent = {
  name: 'Umami',
  logo: '/tools/umami-logo.svg',
  seo: {
    title: 'Betterlytics vs Umami: Session Replay and Monitoring Included',
    description:
      'Compare Betterlytics to Umami. Same privacy-first analytics, plus uptime monitoring, status pages and session replay on every plan. Free tier available.',
  },
  hero: {
    title: 'Looking for an Umami Alternative?',
    titleHighlight: 'Alternative',
    subtitle:
      "Love Umami's simplicity? Get the same lightweight, privacy-first analytics, plus uptime monitoring, status pages, and session replay on every plan.",
  },
  keyDifferentiators: [
    {
      title: 'Behavioral Analytics Built In',
      betterlytics:
        'Session replay and user journey tracking show you exactly how visitors interact with your site. Both are on every plan, free tier included.',
      competitor:
        'Journey reports on every plan. On Umami Cloud, session replays start at the $200/month Business plan.',
    },
    {
      title: 'Uptime Monitoring Built In',
      betterlytics: 'Track Core Web Vitals and site availability from the same dashboard as your analytics.',
      competitor: 'Tracks Core Web Vitals, but has no uptime monitoring. That needs a separate tool.',
    },
    {
      title: 'Simpler Self-Hosting Setup',
      betterlytics: 'Docker-based deployment with minimal configuration. Up and running in minutes.',
      competitor: 'Requires PostgreSQL and more manual setup steps.',
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
          { name: 'Script size', betterlytics: '~3.5KB', competitor: '~4KB' },
          { name: 'Page load impact', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Works with ad blockers', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analytics Features',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Global properties', betterlytics: true, competitor: 'Via session properties' },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Outbound link tracking', betterlytics: true, competitor: true },
          { name: 'Funnel analysis', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: true },
          { name: 'User retention', betterlytics: false, competitor: true },
          { name: 'Annotations', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: 'From $200/month' },
          { name: 'Client-side error tracking', betterlytics: true, competitor: true },
          { name: 'Performance monitoring', betterlytics: true, competitor: true },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Public status pages', betterlytics: true, competitor: false },
          { name: 'Notification integrations (Slack, Discord, etc.)', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Ease of Use',
        features: [
          { name: 'Setup time', betterlytics: '<5 minutes', competitor: '<5 minutes' },
          { name: 'Learning curve', betterlytics: 'Gentle', competitor: 'Gentle' },
          { name: 'Simple, intuitive interface', betterlytics: true, competitor: true },
          { name: 'Data retention', betterlytics: 'Up to 5 years', competitor: '6 months to 5 years' },
        ],
      },
      {
        name: 'Pricing & Support',
        features: [
          { name: 'Free tier available', betterlytics: true, competitor: true },
          { name: 'Transparent pricing', betterlytics: true, competitor: true },
          { name: 'Self-hosting option', betterlytics: true, competitor: true },
          { name: 'Email support', betterlytics: true, competitor: 'Paid plans only' },
        ],
      },
      {
        name: 'AI & Integrations',
        features: [
          { name: 'MCP server', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Both Built for Privacy',
      content: `Umami and Betterlytics share the same DNA: cookieless, GDPR-ready, no cookie banners needed. Both tools are built to respect user privacy from the ground up.\n\nNeither requires consent banners under GDPR. Neither sells or shares your data. If you're leaving Google Analytics for privacy reasons, both are solid choices. The question is which feature set fits your needs.`,
      icon: 'shield',
    },
    {
      title: 'Understand the "Why" Behind Metrics',
      content: `Umami shows you what happened: pageviews, referrers, events, conversions and journeys. It also has session replays, but on Umami Cloud they start with the $200/month Business plan.\n\nBetterlytics includes session replay on every plan, free tier included. You can watch how users interact with your site, see where they click or scroll, and spot friction points. Useful when you want to understand behavior, not just count visits.`,
      icon: 'eye',
    },
    {
      title: 'Stay Ahead of Downtime',
      content: `Umami tracks Core Web Vitals, but has no uptime monitoring. For uptime checks and alerts, you would use a separate tool.\n\nBetterlytics includes uptime monitoring and Core Web Vitals tracking. You get alerts via Slack, Discord, Teams, or webhooks when your site is slow or down, and can see performance data alongside traffic stats in the same dashboard.`,
      icon: 'gauge',
    },
    {
      title: 'Hosted or Self-Hosted',
      content: `Both tools support self-hosting. Umami runs on PostgreSQL. Betterlytics uses Docker with ClickHouse.\n\nFor managed hosting, both have a free tier. Betterlytics paid plans start at $9/month, Umami Cloud at $20/month. Umami keeps session replays for its $200/month Business plan.`,
      icon: 'server',
    },
    {
      title: 'Where Umami Shines',
      content: `Umami does simple analytics well. It has user retention reports, public shareable dashboards, and a solid open-source community.\n\nBetterlytics is a good fit if you also want uptime monitoring, status pages, and session replay on every plan alongside your analytics. Same privacy focus, a few more tools included.`,
      icon: 'target',
    },
  ],
};
