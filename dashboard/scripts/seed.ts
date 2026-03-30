import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../.env') });

import { createClient } from '@clickhouse/client';
import { performance } from 'perf_hooks';

const args = process.argv.slice(2);

const DEFAULTS = {
  siteId: 'seed-benchmark-site',
  events: 100_000,
  users: 5_000,
  days: 90,
  batchSize: 10_000,
  customEventFreq: 0.15,
  outboundLinkFreq: 0.05,
  cwvFreq: 0.08,
  scrollDepthFreq: 0.1,
  campaignFreq: 0.2,
  campaigns: 12,
  domain: 'example.com',
};

function printUsage() {
  console.log(`
Usage: npx tsx scripts/seed.ts [site-id] [options]

Options:
  --events=N           Total events to generate (default: ${DEFAULTS.events})
  --users=N            Unique visitors (default: ${DEFAULTS.users})
  --days=N             Days to spread events across (default: ${DEFAULTS.days})
  --batch-size=N       Rows per INSERT batch (default: ${DEFAULTS.batchSize})
  --custom-freq=N      Fraction of custom events 0-1 (default: ${DEFAULTS.customEventFreq})
  --outbound-freq=N    Fraction of outbound link events (default: ${DEFAULTS.outboundLinkFreq})
  --cwv-freq=N         Fraction of core web vitals events (default: ${DEFAULTS.cwvFreq})
  --scroll-freq=N      Fraction of scroll depth events (default: ${DEFAULTS.scrollDepthFreq})
  --campaign-freq=N    Fraction with UTM params (default: ${DEFAULTS.campaignFreq})
  --campaigns=N        Number of unique campaigns (default: ${DEFAULTS.campaigns})
  --domain=S           Domain for URLs (default: ${DEFAULTS.domain})

Example:
  npx tsx scripts/seed.ts my-site-id --events=500000 --users=10000 --days=180
`);
}

function getFlag(name: string, fallback: number): number {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? parseFloat(arg.split('=')[1]) : fallback;
}

function getStringFlag(name: string, fallback: string): string {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : fallback;
}

const firstArg = args[0];
if (firstArg === '--help' || firstArg === '-h') {
  printUsage();
  process.exit(0);
}

const SITE_ID = firstArg && !firstArg.startsWith('--') ? firstArg : DEFAULTS.siteId;
const NUM_EVENTS = getFlag('events', DEFAULTS.events);
const NUM_USERS = getFlag('users', DEFAULTS.users);
const NUM_DAYS = getFlag('days', DEFAULTS.days);
const BATCH_SIZE = getFlag('batch-size', DEFAULTS.batchSize);
const CUSTOM_EVENT_FREQ = getFlag('custom-freq', DEFAULTS.customEventFreq);
const OUTBOUND_LINK_FREQ = getFlag('outbound-freq', DEFAULTS.outboundLinkFreq);
const CWV_FREQ = getFlag('cwv-freq', DEFAULTS.cwvFreq);
const SCROLL_DEPTH_FREQ = getFlag('scroll-freq', DEFAULTS.scrollDepthFreq);
const CAMPAIGN_FREQ = getFlag('campaign-freq', DEFAULTS.campaignFreq);
const NUM_CAMPAIGNS = getFlag('campaigns', DEFAULTS.campaigns);
const DOMAIN = getStringFlag('domain', DEFAULTS.domain);

const PAGES = [
  '/',
  '/pricing',
  '/about',
  '/blog',
  '/blog/getting-started-with-analytics',
  '/blog/privacy-first-tracking',
  '/blog/cookieless-analytics-guide',
  '/blog/gdpr-compliance-tips',
  '/blog/website-performance-optimization',
  '/blog/understanding-bounce-rate',
  '/blog/seo-analytics-integration',
  '/blog/real-time-analytics-benefits',
  '/docs',
  '/docs/installation',
  '/docs/configuration',
  '/docs/api-reference',
  '/docs/self-hosting',
  '/docs/troubleshooting',
  '/features',
  '/features/session-replay',
  '/features/funnels',
  '/features/web-vitals',
  '/features/uptime-monitoring',
  '/contact',
  '/login',
  '/signup',
  '/dashboard',
  '/changelog',
  '/privacy-policy',
  '/terms-of-service',
  '/integrations',
  '/integrations/wordpress',
  '/integrations/nextjs',
  '/integrations/shopify',
  '/integrations/react',
  '/demo',
  '/careers',
  '/case-studies',
  '/case-studies/saas-growth',
  '/case-studies/ecommerce-optimization',
];

const REFERRER_SOURCES: { source: string; name: string; url: string }[] = [
  { source: 'search', name: 'Google', url: 'https://www.google.com/' },
  { source: 'search', name: 'Google', url: 'https://www.google.com/' },
  { source: 'search', name: 'Google', url: 'https://www.google.com/' },
  { source: 'search', name: 'Bing', url: 'https://www.bing.com/' },
  { source: 'search', name: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
  { source: 'social', name: 'Twitter', url: 'https://t.co/abc123' },
  { source: 'social', name: 'Twitter', url: 'https://t.co/def456' },
  { source: 'social', name: 'LinkedIn', url: 'https://www.linkedin.com/' },
  { source: 'social', name: 'Facebook', url: 'https://www.facebook.com/' },
  { source: 'social', name: 'Reddit', url: 'https://www.reddit.com/r/selfhosted/' },
  { source: 'social', name: 'Reddit', url: 'https://www.reddit.com/r/webdev/' },
  { source: 'social', name: 'Hacker News', url: 'https://news.ycombinator.com/' },
  { source: 'social', name: 'YouTube', url: 'https://www.youtube.com/' },
  { source: 'social', name: 'Mastodon', url: 'https://mastodon.social/' },
  { source: 'referral', name: 'GitHub', url: 'https://github.com/betterlytics' },
  { source: 'referral', name: 'Dev.to', url: 'https://dev.to/analytics-article' },
  { source: 'referral', name: 'ProductHunt', url: 'https://www.producthunt.com/' },
  { source: 'referral', name: 'AlternativeTo', url: 'https://alternativeto.net/' },
  { source: 'referral', name: 'Medium', url: 'https://medium.com/' },
  { source: 'email', name: 'Newsletter', url: '' },
  { source: 'direct', name: '', url: '' },
  { source: 'direct', name: '', url: '' },
  { source: 'direct', name: '', url: '' },
  { source: 'direct', name: '', url: '' },
];

const SEARCH_TERMS = [
  'privacy analytics', 'cookieless tracking', 'google analytics alternative',
  'self hosted analytics', 'gdpr compliant analytics', 'open source analytics',
  'website tracking', 'betterlytics', 'web analytics tool', '',
];

const CUSTOM_EVENTS = [
  { name: 'signup_started', props: () => ({ plan: pick(['free', 'pro', 'enterprise']) }) },
  { name: 'signup_completed', props: () => ({ plan: pick(['free', 'pro', 'enterprise']), method: pick(['email', 'google', 'github']) }) },
  { name: 'button_click', props: () => ({ button_id: pick(['cta-hero', 'cta-pricing', 'cta-nav', 'cta-footer', 'cta-banner']) }) },
  { name: 'purchase', props: () => ({ plan: pick(['pro', 'enterprise']), amount: pick([29, 49, 99, 199]), currency: 'USD' }) },
  { name: 'feature_used', props: () => ({ feature: pick(['filters', 'export', 'funnel', 'session-replay', 'annotations', 'comparison']) }) },
  { name: 'download', props: () => ({ file: pick(['whitepaper.pdf', 'case-study.pdf', 'setup-guide.pdf', 'api-docs.pdf']) }) },
  { name: 'video_play', props: () => ({ video: pick(['intro', 'demo', 'tutorial-filters', 'tutorial-funnels']) }) },
  { name: 'form_submit', props: () => ({ form: pick(['contact', 'demo-request', 'newsletter', 'feedback']) }) },
  { name: 'error', props: () => ({ code: pick([400, 403, 404, 500]), page: pick(PAGES.slice(0, 10)) }) },
  { name: 'search', props: () => ({ query: pick(['dashboard', 'api', 'install', 'pricing', 'export', 'filter']) }) },
];

const OUTBOUND_LINKS = [
  'https://github.com/betterlytics/betterlytics',
  'https://docs.betterlytics.io',
  'https://twitter.com/betterlytics',
  'https://discord.gg/betterlytics',
  'https://www.npmjs.com/package/betterlytics',
  'https://hub.docker.com/r/betterlytics/betterlytics',
  'https://stackoverflow.com/questions/tagged/betterlytics',
  'https://www.youtube.com/@betterlytics',
];

const BROWSERS = [
  { name: 'Chrome', versions: ['120.0', '121.0', '122.0', '123.0', '124.0', '125.0'], weight: 45 },
  { name: 'Firefox', versions: ['121.0', '122.0', '123.0', '124.0', '125.0'], weight: 15 },
  { name: 'Safari', versions: ['17.0', '17.1', '17.2', '17.3', '17.4'], weight: 20 },
  { name: 'Edge', versions: ['120.0', '121.0', '122.0', '123.0', '124.0'], weight: 12 },
  { name: 'Opera', versions: ['105.0', '106.0', '107.0'], weight: 3 },
  { name: 'Brave', versions: ['1.62', '1.63', '1.64'], weight: 3 },
  { name: 'Samsung Internet', versions: ['23.0', '24.0'], weight: 2 },
];

const OS_LIST = [
  { name: 'Windows', versions: ['10', '11'], weight: 35 },
  { name: 'macOS', versions: ['13.0', '14.0', '14.1', '14.2', '14.3'], weight: 25 },
  { name: 'Linux', versions: ['', 'Ubuntu', 'Fedora'], weight: 10 },
  { name: 'iOS', versions: ['16.0', '17.0', '17.1', '17.2', '17.3', '17.4'], weight: 18 },
  { name: 'Android', versions: ['13', '14', '15'], weight: 12 },
];

const DEVICE_TYPES = [
  { type: 'desktop', weight: 55 },
  { type: 'mobile', weight: 35 },
  { type: 'tablet', weight: 10 },
];

const COUNTRIES = [
  { code: 'US', subdivisions: ['US-CA', 'US-NY', 'US-TX', 'US-FL', 'US-WA', 'US-IL', 'US-MA', 'US-CO'], cities: ['San Francisco', 'New York', 'Austin', 'Miami', 'Seattle', 'Chicago', 'Boston', 'Denver'], weight: 30 },
  { code: 'GB', subdivisions: ['GB-ENG', 'GB-SCT', 'GB-WLS'], cities: ['London', 'Manchester', 'Edinburgh', 'Cardiff', 'Birmingham'], weight: 12 },
  { code: 'DE', subdivisions: ['DE-BE', 'DE-BY', 'DE-HH', 'DE-HE'], cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'], weight: 10 },
  { code: 'FR', subdivisions: ['FR-75', 'FR-69', 'FR-13'], cities: ['Paris', 'Lyon', 'Marseille'], weight: 8 },
  { code: 'NL', subdivisions: ['NL-NH', 'NL-ZH', 'NL-UT'], cities: ['Amsterdam', 'Rotterdam', 'Utrecht'], weight: 7 },
  { code: 'CA', subdivisions: ['CA-ON', 'CA-BC', 'CA-QC'], cities: ['Toronto', 'Vancouver', 'Montreal'], weight: 6 },
  { code: 'AU', subdivisions: ['AU-NSW', 'AU-VIC', 'AU-QLD'], cities: ['Sydney', 'Melbourne', 'Brisbane'], weight: 5 },
  { code: 'JP', subdivisions: ['JP-13', 'JP-27'], cities: ['Tokyo', 'Osaka'], weight: 4 },
  { code: 'BR', subdivisions: ['BR-SP', 'BR-RJ'], cities: ['Sao Paulo', 'Rio de Janeiro'], weight: 4 },
  { code: 'IN', subdivisions: ['IN-KA', 'IN-MH', 'IN-DL'], cities: ['Bangalore', 'Mumbai', 'Delhi'], weight: 4 },
  { code: 'SE', subdivisions: ['SE-AB', 'SE-O'], cities: ['Stockholm', 'Gothenburg'], weight: 3 },
  { code: 'ES', subdivisions: ['ES-MD', 'ES-CT'], cities: ['Madrid', 'Barcelona'], weight: 3 },
  { code: 'IT', subdivisions: ['IT-RM', 'IT-MI'], cities: ['Rome', 'Milan'], weight: 2 },
  { code: 'PL', subdivisions: ['PL-MZ', 'PL-MA'], cities: ['Warsaw', 'Krakow'], weight: 2 },
];

const UTM_SOURCES = ['google', 'facebook', 'twitter', 'linkedin', 'newsletter', 'bing', 'instagram', 'reddit', 'producthunt', 'tiktok'];
const UTM_MEDIUMS = ['cpc', 'social', 'email', 'organic', 'referral', 'display', 'affiliate', 'video', 'podcast'];
const UTM_TERMS = ['analytics', 'dashboard', 'tracking', 'marketing', 'conversion', 'privacy', 'cookieless', 'gdpr', 'self-hosted', ''];
const UTM_CONTENTS = ['banner_a', 'banner_b', 'sidebar', 'footer', 'hero', 'popup', 'inline', 'text_link', ''];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T extends { weight: number }>(arr: T[]): T {
  const total = arr.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of arr) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return arr[arr.length - 1];
}

function gaussianRand(): number {
  let rand = 0;
  for (let i = 0; i < 6; i++) rand += Math.random();
  return rand / 6;
}

function randomVisitorId(): number {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const view = new DataView(buf.buffer);
  return Number(view.getBigUint64(0) & BigInt('9223372036854775807'));
}

function randomSessionId(): number {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const view = new DataView(buf.buffer);
  return Number(view.getBigUint64(0) & BigInt('9223372036854775807'));
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

type Visitor = {
  visitorId: number;
  country: typeof COUNTRIES[number];
  subdivisionIdx: number;
  browser: typeof BROWSERS[number];
  browserVersion: string;
  os: typeof OS_LIST[number];
  osVersion: string;
  deviceType: string;
};

function generateVisitors(count: number): Visitor[] {
  const visitors: Visitor[] = [];
  for (let i = 0; i < count; i++) {
    const country = weightedPick(COUNTRIES);
    const browser = weightedPick(BROWSERS);
    const os = weightedPick(OS_LIST);
    const device = weightedPick(DEVICE_TYPES);
    visitors.push({
      visitorId: randomVisitorId(),
      country,
      subdivisionIdx: Math.floor(Math.random() * country.subdivisions.length),
      browser,
      browserVersion: pick(browser.versions),
      os,
      osVersion: pick(os.versions),
      deviceType: device.type,
    });
  }
  return visitors;
}

type EventRow = {
  site_id: string;
  visitor_id: number;
  session_id: number;
  domain: string;
  url: string;
  device_type: string;
  country_code: string;
  subdivision_code: string;
  city: string;
  timestamp: string;
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  referrer_source: string;
  referrer_source_name: string;
  referrer_search_term: string;
  referrer_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  event_type: string;
  custom_event_name: string;
  custom_event_json: string;
  outbound_link_url: string;
  cwv_cls: number | null;
  cwv_lcp: number | null;
  cwv_inp: number | null;
  cwv_fcp: number | null;
  cwv_ttfb: number | null;
  scroll_depth_percentage: number | null;
  scroll_depth_pixels: number | null;
};

function generateEvents(visitors: Visitor[], campaignNames: string[]): EventRow[] {
  const events: EventRow[] = [];
  const now = Date.now();

  const visitorDay = new Map<number, number>();
  for (const v of visitors) {
    visitorDay.set(v.visitorId, NUM_DAYS === 0 ? 0 : Math.floor(Math.random() * NUM_DAYS));
  }

  for (let i = 0; i < NUM_EVENTS; i++) {
    const visitor = pick(visitors);
    const assignedDay = visitorDay.get(visitor.visitorId)!;
    const daysAgo = assignedDay + gaussianRand();
    const msAgo = daysAgo * 86_400_000;
    const timestamp = new Date(now - msAgo);

    const rand = Math.random();
    let eventType: string;
    let customEventName = '';
    let customEventJson = '{}';
    let outboundLinkUrl = '';
    let cwvCls: number | null = null;
    let cwvLcp: number | null = null;
    let cwvInp: number | null = null;
    let cwvFcp: number | null = null;
    let cwvTtfb: number | null = null;
    let scrollPct: number | null = null;
    let scrollPx: number | null = null;

    let cumulative = 0;
    if (rand < (cumulative += CUSTOM_EVENT_FREQ)) {
      eventType = 'custom';
      const evt = pick(CUSTOM_EVENTS);
      customEventName = evt.name;
      customEventJson = JSON.stringify(evt.props());
    } else if (rand < (cumulative += OUTBOUND_LINK_FREQ)) {
      eventType = 'outbound_link';
      outboundLinkUrl = pick(OUTBOUND_LINKS);
    } else if (rand < (cumulative += CWV_FREQ)) {
      eventType = 'cwv';
      cwvCls = Math.random() * 0.5;
      cwvLcp = 500 + Math.random() * 4000;
      cwvInp = 50 + Math.random() * 500;
      cwvFcp = 300 + Math.random() * 3000;
      cwvTtfb = 50 + Math.random() * 1500;
    } else if (rand < (cumulative += SCROLL_DEPTH_FREQ)) {
      eventType = 'scroll_depth';
      scrollPct = Math.floor(Math.random() * 100);
      scrollPx = Math.floor(scrollPct * (1000 + Math.random() * 4000) / 100);
    } else {
      eventType = 'pageview';
    }

    const referrer = pick(REFERRER_SOURCES);
    const hasCampaign = Math.random() < CAMPAIGN_FREQ;
    const page = pick(PAGES);
    const fullUrl = `https://${DOMAIN}${page}`;

    const country = visitor.country;
    const subIdx = visitor.subdivisionIdx;

    events.push({
      site_id: SITE_ID,
      visitor_id: visitor.visitorId,
      session_id: randomSessionId(),
      domain: DOMAIN,
      url: fullUrl,
      device_type: visitor.deviceType,
      country_code: country.code,
      subdivision_code: country.subdivisions[subIdx],
      city: country.cities[Math.min(subIdx, country.cities.length - 1)],
      timestamp: formatDateTime(timestamp),
      browser: visitor.browser.name,
      browser_version: visitor.browserVersion,
      os: visitor.os.name,
      os_version: visitor.osVersion,
      referrer_source: referrer.source,
      referrer_source_name: referrer.name,
      referrer_search_term: referrer.source === 'search' ? pick(SEARCH_TERMS) : '',
      referrer_url: referrer.url,
      utm_source: hasCampaign ? pick(UTM_SOURCES) : '',
      utm_medium: hasCampaign ? pick(UTM_MEDIUMS) : '',
      utm_campaign: hasCampaign ? pick(campaignNames) : '',
      utm_term: hasCampaign ? pick(UTM_TERMS) : '',
      utm_content: hasCampaign ? pick(UTM_CONTENTS) : '',
      event_type: eventType,
      custom_event_name: customEventName,
      custom_event_json: customEventJson,
      outbound_link_url: outboundLinkUrl,
      cwv_cls: cwvCls,
      cwv_lcp: cwvLcp,
      cwv_inp: cwvInp,
      cwv_fcp: cwvFcp,
      cwv_ttfb: cwvTtfb,
      scroll_depth_percentage: scrollPct,
      scroll_depth_pixels: scrollPx,
    });
  }

  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return events;
}

async function main() {
  const client = createClient({
    url: process.env.CLICKHOUSE_URL!,
    username: process.env.CLICKHOUSE_USER!,
    password: process.env.CLICKHOUSE_PASSWORD!,
    request_timeout: 120_000,
    clickhouse_settings: {
      async_insert: 1,
      wait_for_async_insert: 1,
    },
  });

  const campaignNames = Array.from({ length: NUM_CAMPAIGNS }, (_, i) =>
    `campaign-${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}-${String(randomSessionId()).slice(0, 6)}`
  );

  console.log('ClickHouse Seed Script');
  console.log('======================');
  console.log(`Site ID:     ${SITE_ID}`);
  console.log(`Events:      ${NUM_EVENTS.toLocaleString()}`);
  console.log(`Users:       ${NUM_USERS.toLocaleString()}`);
  console.log(`Days:        ${NUM_DAYS}`);
  console.log(`Batch size:  ${BATCH_SIZE.toLocaleString()}`);
  console.log(`Domain:      ${DOMAIN}`);
  console.log(`ClickHouse:  ${process.env.CLICKHOUSE_URL}`);
  console.log('');

  process.stdout.write('Generating visitors...');
  const visitors = generateVisitors(NUM_USERS);
  console.log(` ${visitors.length.toLocaleString()} visitors`);

  process.stdout.write('Generating events...');
  const startGen = performance.now();
  const events = generateEvents(visitors, campaignNames);
  console.log(` ${events.length.toLocaleString()} events in ${((performance.now() - startGen) / 1000).toFixed(1)}s`);

  const eventBreakdown = events.reduce((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('Event breakdown:', Object.entries(eventBreakdown).map(([k, v]) => `${k}: ${v.toLocaleString()}`).join(', '));

  const campaignCount = events.filter((e) => e.utm_campaign).length;
  console.log(`With UTM campaigns: ${campaignCount.toLocaleString()} (${((campaignCount / events.length) * 100).toFixed(1)}%)`);
  console.log('');

  const startInsert = performance.now();
  let inserted = 0;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    await client.insert({
      table: 'analytics.events',
      values: batch,
      format: 'JSONEachRow',
    });

    inserted += batch.length;
    const pct = ((inserted / events.length) * 100).toFixed(0);
    const elapsed = ((performance.now() - startInsert) / 1000).toFixed(1);
    process.stdout.write(`\r  Inserting... ${inserted.toLocaleString()} / ${events.length.toLocaleString()} (${pct}%) [${elapsed}s]`);
  }

  const totalTime = ((performance.now() - startInsert) / 1000).toFixed(2);
  console.log(`\n\nDone! Inserted ${inserted.toLocaleString()} events in ${totalTime}s`);
  console.log(`Rate: ${Math.round(inserted / parseFloat(totalTime)).toLocaleString()} events/s`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
