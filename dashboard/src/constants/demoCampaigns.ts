type Weighted = [label: string, weight: number];

export type DemoCampaign = {
  name: string;
  /** Unique visitors over the last 7 days */
  visitors: number;
  /** Share of the 7-day visitors that arrived in the last 24 hours */
  last24hShare: number;
  sessionsPerVisitor: number;
  bounceRate: number;
  pagesPerSession: number;
  avgSessionSeconds: number;
  sources: Weighted[];
  mediums: Weighted[];
  contents: Weighted[];
  terms: Weighted[];
  entryPages: Weighted[];
  devices: Weighted[];
  countries: Weighted[];
  browsers: Weighted[];
  operatingSystems: Weighted[];
};

// Served to public demo visitors on Cloud instead of betterlytics.io's own (nearly empty) campaign data.
// Together the campaigns stay around 10-15% of the demo's typical weekly visitors.
export const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    name: 'privacy-analytics-search',
    visitors: 250,
    last24hShare: 0.16,
    sessionsPerVisitor: 1.08,
    bounceRate: 0.52,
    pagesPerSession: 1.9,
    avgSessionSeconds: 71,
    sources: [
      ['google', 0.81],
      ['bing', 0.19],
    ],
    mediums: [['cpc', 1]],
    contents: [
      ['headline-cookieless', 0.45],
      ['headline-gdpr', 0.33],
      ['headline-open-source', 0.22],
    ],
    terms: [
      ['privacy friendly analytics', 0.38],
      ['cookieless analytics', 0.27],
      ['gdpr compliant analytics', 0.2],
      ['privacy first web analytics', 0.15],
    ],
    entryPages: [
      ['/', 0.58],
      ['/pricing', 0.24],
      ['/features', 0.18],
    ],
    devices: [
      ['desktop', 0.68],
      ['mobile', 0.29],
      ['tablet', 0.03],
    ],
    countries: [
      ['US', 0.31],
      ['DE', 0.22],
      ['GB', 0.15],
      ['NL', 0.1],
    ],
    browsers: [
      ['Chrome', 0.61],
      ['Safari', 0.2],
      ['Edge', 0.11],
      ['Firefox', 0.08],
    ],
    operatingSystems: [
      ['Windows', 0.42],
      ['macOS', 0.26],
      ['Android', 0.17],
      ['iOS', 0.15],
    ],
  },
  {
    name: 'monthly-newsletter',
    visitors: 175,
    last24hShare: 0.09,
    sessionsPerVisitor: 1.21,
    bounceRate: 0.34,
    pagesPerSession: 2.8,
    avgSessionSeconds: 148,
    sources: [['newsletter', 1]],
    mediums: [['email', 1]],
    contents: [
      ['feature-highlight', 0.47],
      ['header-link', 0.31],
      ['footer-link', 0.22],
    ],
    terms: [
      ['subscribers', 0.81],
      ['new-subscribers', 0.19],
    ],
    entryPages: [
      ['/changelog', 0.44],
      ['/features', 0.27],
      ['/', 0.18],
      ['/pricing', 0.11],
    ],
    devices: [
      ['desktop', 0.55],
      ['mobile', 0.41],
      ['tablet', 0.04],
    ],
    countries: [
      ['DK', 0.24],
      ['US', 0.21],
      ['DE', 0.17],
      ['SE', 0.11],
    ],
    browsers: [
      ['Chrome', 0.48],
      ['Safari', 0.34],
      ['Firefox', 0.11],
      ['Edge', 0.07],
    ],
    operatingSystems: [
      ['macOS', 0.33],
      ['iOS', 0.29],
      ['Windows', 0.24],
      ['Android', 0.14],
    ],
  },
  {
    name: 'self-hosting-guide',
    visitors: 140,
    last24hShare: 0.15,
    sessionsPerVisitor: 1.16,
    bounceRate: 0.41,
    pagesPerSession: 2.6,
    avgSessionSeconds: 186,
    sources: [
      ['reddit', 0.52],
      ['x', 0.27],
      ['linkedin', 0.21],
    ],
    mediums: [['social', 1]],
    contents: [
      ['docker-compose-post', 0.56],
      ['guide-thread', 0.44],
    ],
    terms: [
      ['selfhosted', 0.61],
      ['devops', 0.39],
    ],
    entryPages: [
      ['/docs/installation/self-hosting', 0.71],
      ['/', 0.18],
      ['/pricing', 0.11],
    ],
    devices: [
      ['desktop', 0.79],
      ['mobile', 0.2],
      ['tablet', 0.01],
    ],
    countries: [
      ['US', 0.29],
      ['DE', 0.21],
      ['FR', 0.12],
      ['PL', 0.09],
    ],
    browsers: [
      ['Firefox', 0.38],
      ['Chrome', 0.37],
      ['Safari', 0.14],
      ['Edge', 0.11],
    ],
    operatingSystems: [
      ['Linux', 0.36],
      ['Windows', 0.27],
      ['macOS', 0.24],
      ['Android', 0.13],
    ],
  },
  {
    name: 'product-launch-post',
    visitors: 110,
    last24hShare: 0.11,
    sessionsPerVisitor: 1.05,
    bounceRate: 0.47,
    pagesPerSession: 2.2,
    avgSessionSeconds: 97,
    sources: [
      ['x', 0.46],
      ['linkedin', 0.33],
      ['reddit', 0.21],
    ],
    mediums: [
      ['social', 0.84],
      ['paid-social', 0.16],
    ],
    contents: [
      ['launch-video', 0.53],
      ['launch-thread', 0.47],
    ],
    terms: [
      ['founders', 0.42],
      ['developers', 0.35],
      ['marketers', 0.23],
    ],
    entryPages: [
      ['/', 0.62],
      ['/demo', 0.23],
      ['/pricing', 0.15],
    ],
    devices: [
      ['mobile', 0.51],
      ['desktop', 0.46],
      ['tablet', 0.03],
    ],
    countries: [
      ['US', 0.36],
      ['GB', 0.16],
      ['IN', 0.12],
      ['DE', 0.11],
    ],
    browsers: [
      ['Chrome', 0.52],
      ['Safari', 0.37],
      ['Edge', 0.06],
      ['Firefox', 0.05],
    ],
    operatingSystems: [
      ['iOS', 0.32],
      ['Windows', 0.25],
      ['Android', 0.22],
      ['macOS', 0.21],
    ],
  },
  {
    name: 'changelog-digest',
    visitors: 90,
    last24hShare: 0.18,
    sessionsPerVisitor: 1.27,
    bounceRate: 0.29,
    pagesPerSession: 3.1,
    avgSessionSeconds: 164,
    sources: [
      ['newsletter', 0.63],
      ['x', 0.37],
    ],
    mediums: [
      ['email', 0.63],
      ['social', 0.37],
    ],
    contents: [
      ['release-notes', 0.58],
      ['whats-new-card', 0.42],
    ],
    terms: [
      ['customers', 0.7],
      ['followers', 0.3],
    ],
    entryPages: [
      ['/changelog', 0.71],
      ['/features', 0.18],
      ['/', 0.11],
    ],
    devices: [
      ['desktop', 0.72],
      ['mobile', 0.26],
      ['tablet', 0.02],
    ],
    countries: [
      ['DK', 0.22],
      ['DE', 0.19],
      ['US', 0.18],
      ['NO', 0.1],
    ],
    browsers: [
      ['Chrome', 0.55],
      ['Firefox', 0.2],
      ['Safari', 0.17],
      ['Edge', 0.08],
    ],
    operatingSystems: [
      ['macOS', 0.37],
      ['Windows', 0.33],
      ['Linux', 0.16],
      ['iOS', 0.14],
    ],
  },
  {
    name: 'privacy-webinar',
    visitors: 70,
    last24hShare: 0.21,
    sessionsPerVisitor: 1.12,
    bounceRate: 0.38,
    pagesPerSession: 2.4,
    avgSessionSeconds: 132,
    sources: [
      ['linkedin', 0.68],
      ['newsletter', 0.32],
    ],
    mediums: [
      ['social', 0.45],
      ['email', 0.32],
      ['paid-social', 0.23],
    ],
    contents: [
      ['speaker-card', 0.55],
      ['invite', 0.45],
    ],
    terms: [
      ['dpo', 0.44],
      ['marketing-leads', 0.33],
      ['agencies', 0.23],
    ],
    entryPages: [
      ['/', 0.47],
      ['/privacy', 0.31],
      ['/features', 0.22],
    ],
    devices: [
      ['desktop', 0.74],
      ['mobile', 0.24],
      ['tablet', 0.02],
    ],
    countries: [
      ['DE', 0.27],
      ['NL', 0.2],
      ['DK', 0.16],
      ['GB', 0.14],
    ],
    browsers: [
      ['Chrome', 0.58],
      ['Edge', 0.2],
      ['Safari', 0.16],
      ['Firefox', 0.06],
    ],
    operatingSystems: [
      ['Windows', 0.51],
      ['macOS', 0.27],
      ['iOS', 0.13],
      ['Android', 0.09],
    ],
  },
  {
    name: 'cookieless-analytics-search',
    visitors: 55,
    last24hShare: 0.15,
    sessionsPerVisitor: 1.06,
    bounceRate: 0.57,
    pagesPerSession: 1.7,
    avgSessionSeconds: 58,
    sources: [['google', 1]],
    mediums: [['cpc', 1]],
    contents: [
      ['headline-no-banner', 0.61],
      ['headline-lightweight', 0.39],
    ],
    terms: [
      ['cookieless tracking', 0.46],
      ['analytics without cookie banner', 0.34],
      ['lightweight analytics script', 0.2],
    ],
    entryPages: [
      ['/', 0.66],
      ['/features', 0.34],
    ],
    devices: [
      ['desktop', 0.63],
      ['mobile', 0.35],
      ['tablet', 0.02],
    ],
    countries: [
      ['US', 0.34],
      ['GB', 0.19],
      ['CA', 0.12],
      ['DE', 0.11],
    ],
    browsers: [
      ['Chrome', 0.64],
      ['Safari', 0.23],
      ['Edge', 0.13],
    ],
    operatingSystems: [
      ['Windows', 0.38],
      ['macOS', 0.25],
      ['Android', 0.2],
      ['iOS', 0.17],
    ],
  },
  {
    name: 'gdpr-checklist',
    visitors: 40,
    last24hShare: 0.13,
    sessionsPerVisitor: 1.1,
    bounceRate: 0.44,
    pagesPerSession: 2.1,
    avgSessionSeconds: 109,
    sources: [
      ['linkedin', 0.71],
      ['x', 0.29],
    ],
    mediums: [['social', 1]],
    contents: [
      ['carousel', 0.64],
      ['checklist-post', 0.36],
    ],
    terms: [
      ['compliance', 0.57],
      ['web-teams', 0.43],
    ],
    entryPages: [
      ['/privacy', 0.52],
      ['/', 0.48],
    ],
    devices: [
      ['desktop', 0.66],
      ['mobile', 0.34],
    ],
    countries: [
      ['DE', 0.31],
      ['FR', 0.21],
      ['DK', 0.17],
      ['ES', 0.12],
    ],
    browsers: [
      ['Chrome', 0.6],
      ['Edge', 0.22],
      ['Safari', 0.18],
    ],
    operatingSystems: [
      ['Windows', 0.47],
      ['macOS', 0.29],
      ['Android', 0.24],
    ],
  },
];
