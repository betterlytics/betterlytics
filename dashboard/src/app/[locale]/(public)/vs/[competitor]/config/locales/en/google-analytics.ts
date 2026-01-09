import { ComparisonLocaleContent } from '../..';

export const googleAnalytics: ComparisonLocaleContent = {
  name: 'Google Analytics',
  logo: '/tools/google_analytics-logo.svg',
  seo: {
    title: 'Betterlytics vs Google Analytics: Privacy-First Alternative',
    description:
      'Compare Betterlytics to Google Analytics. Get lightweight, GDPR-ready analytics with no cookie banners, faster page loads, and full data ownership. Free tier available.',
    keywords: [
      'Google Analytics alternative',
      'GA4 alternative',
      'privacy-first analytics',
      'GDPR compliant analytics',
      'cookieless analytics',
      'lightweight web analytics',
      'Google Analytics replacement',
    ],
  },
  hero: {
    title: 'Looking for a Google Analytics Alternative?',
    titleHighlight: 'Alternative',
    subtitle: 'A lightweight, privacy-first alternative to Google Analytics. No cookies, no banners, no bloat.',
  },
  keyDifferentiators: [
    {
      title: 'No Cookie Banners',
      betterlytics: 'Cookieless by design. Your visitors browse freely without interruptions.',
      competitor:
        'Typically requires consent banners, which can hurt UX and reduce data accuracy when users opt out.',
    },
    {
      title: 'Lightning Fast',
      betterlytics: '<2KB script loads instantly with zero impact on page performance.',
      competitor: '~100KB+ script size depending on configuration; commonly blocked by ad blockers.',
    },
    {
      title: 'Your Data, Forever',
      betterlytics: 'You own your data. Never shared or sold. EU-hosted with up to 5 years retention.',
      competitor:
        'Google may use aggregated data to improve advertising and related services. Limited to 14 months retention.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy & Compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: false },
          { name: 'GDPR-ready by default', betterlytics: true, competitor: false },
          { name: 'No cookie banner needed', betterlytics: true, competitor: false },
          { name: 'EU data hosting', betterlytics: true, competitor: 'Optional' },
          { name: 'Privacy-first by default', betterlytics: true, competitor: false },
          { name: 'No cross-site tracking', betterlytics: true, competitor: false },
          { name: 'Full data ownership', betterlytics: true, competitor: false },
          { name: 'Open source', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Performance & Speed',
        features: [
          { name: 'Script size', betterlytics: '<2KB', competitor: '~100KB+' },
          { name: 'Page load impact', betterlytics: 'Minimal', competitor: 'Noticeable' },
          { name: 'Works with ad blockers', betterlytics: true, competitor: false },
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
          { name: 'Outbound link tracking', betterlytics: true, competitor: 'Requires config' },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'No data sampling', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Ease of Use',
        features: [
          { name: 'Setup time', betterlytics: '<5 minutes', competitor: '30+ minutes' },
          { name: 'Learning curve', betterlytics: 'Gentle', competitor: 'Steep' },
          { name: 'Simple, intuitive interface', betterlytics: true, competitor: false },
          { name: 'No complex configuration', betterlytics: true, competitor: false },
          { name: 'Data retention', betterlytics: 'Up to 5 years', competitor: '14 months' },
        ],
      },
      {
        name: 'Pricing & Support',
        features: [
          { name: 'Free tier available', betterlytics: true, competitor: true },
          { name: 'Transparent pricing', betterlytics: true, competitor: false },
          { name: 'Email support', betterlytics: true, competitor: 'Limited' },
          { name: 'BigQuery export', betterlytics: false, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Privacy That Just Works',
      content: `Google Analytics uses cookies, requires consent banners under GDPR, and has faced rulings from EU data protection authorities. Several EU data protection authorities have raised concerns over data transfers to the US.\n\nBetterlytics is privacy-first from day one. No cookies, no cookie banners needed. All data hosted in the EU. You're GDPR-compliant out of the box.`,
      icon: 'shield',
    },
    {
      title: 'Page Speed Matters',
      content: `Google Analytics scripts weigh over 130KB and make extra requests that slow your site. Can impact SEO and user experience. Commonly blocked by ad blockers and privacy tools, so you're missing data anyway.\n\nOur script is under 2KB, over 98% smaller. Loads async with zero page speed impact. Ad blockers don't block us since we're not in advertising, so you get more complete data.`,
      icon: 'zap',
    },
    {
      title: 'Your Data Stays Yours',
      content: `When you use Google Analytics, Google acts as a data processor and may use aggregated data to improve its services. Your traffic data feeds their algorithms and ad targeting.\n\nWith Betterlytics, your data is yours. We never share, sell, or use it for anything other than your analytics. We're not in the ad business. You pay for a service, we provide it.`,
      icon: 'lock',
    },
    {
      title: 'Simple From Day One',
      content: `GA4 is complex. Data streams, events, conversions, confusing interface. Steep learning curve. Many site owners never fully understand their own analytics.\n\nBetterlytics setup takes 5 minutes. Add the script, done. Dashboard shows metrics that matter in a clean interface. No training required to understand your own traffic.`,
      icon: 'sparkles',
    },
    {
      title: 'No Hidden Costs',
      content: `Google Analytics is "free" but the hidden cost is giving Google your data. Enterprise features? GA360 pricing typically starts in the tens of thousands per year.\n\nBetterlytics is transparent. Starts at $6/month with a free tier. Session replay, monitoring, all features included. No surprise bills, no data trade-offs.`,
      icon: 'dollar',
    },
    {
      title: 'Beyond Analytics',
      content: `GA focuses on analytics. You need separate tools for uptime monitoring, session replay, and performance tracking. More tools, more complexity.\n\nBetterlytics includes it all: analytics, session replay, uptime monitoring, performance tracking. One dashboard, one privacy-first platform for everything you need.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Switch Today',
    title: 'Ready to Leave Google Analytics?',
    subtitle: 'Join thousands who switched to privacy-first analytics without losing insights.',
    buttonText: 'Start Free Trial',
  },
};
