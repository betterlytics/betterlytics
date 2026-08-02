const ENV = require("dotenv").config({ path: "./.env" });

/**
 * CLI Argument Parsing
 */
const args = process.argv.slice(2);

const DEFAULT_ARGS = {
  NUMBER_OF_EVENTS: 4000,
  NUMBER_OF_USERS: 2000,
  SIMULATED_DAYS: 7,
  BATCH_SIZE: 500,
  CUSTOM_EVENT_FREQUENCY: 0.2,
  OUTBOUND_LINK_FREQUENCY: 0.05,
  CAMPAIGN_FREQUENCY: 0.3,
  NUM_CAMPAIGNS: 6,
  REFERRER_FREQUENCY: 0.6,
}


if (!args[0] || args[0].startsWith("--")) {
  const WIDTH = 8;
  const formatNumber = (num) => {
    return typeof num === "number" && num % 1 !== 0
      ? num.toFixed(1).padStart(WIDTH, " ")
      : num.toString().padStart(WIDTH, " ");
  };
  console.error("[Error] ❌ Missing SITE_ID.\nUsage:");
  console.error(`
    ------------------------------------------------------------------------------------------------
    | Flag             | Description                                                | Default  |
    | ---------------- | ---------------------------------------------------------- | -------- |
    | '--events'       | Total number of events to simulate                         | ${formatNumber(DEFAULT_ARGS.NUMBER_OF_EVENTS)} |
    | '--users'        | Number of unique simulated users                           | ${formatNumber(DEFAULT_ARGS.NUMBER_OF_USERS)} |
    | '--days'         | Number of days to spread events across (0 = today only)    | ${formatNumber(DEFAULT_ARGS.SIMULATED_DAYS)} |
    | '--batch-size'   | Number of events sent per batch (concurrent POSTs)         | ${formatNumber(DEFAULT_ARGS.BATCH_SIZE)} |
    | '--event-freq'   | Fraction (0–1) of events that are custom (non-pageview)    | ${formatNumber(DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY)} |
    | '--outbound-freq'| Fraction (0–1) of events that are outbound link clicks     | ${formatNumber(DEFAULT_ARGS.OUTBOUND_LINK_FREQUENCY)} |
    | '--campaign-freq'| Fraction (0–1) of events that have campaign UTM tags       | ${formatNumber(DEFAULT_ARGS.CAMPAIGN_FREQUENCY)} |
    | '--campaigns'    | Number of unique campaigns to generate                     | ${formatNumber(DEFAULT_ARGS.NUM_CAMPAIGNS)} |
    | '--referrer-freq'| Fraction (0–1) of users arriving via an external referrer  | ${formatNumber(DEFAULT_ARGS.REFERRER_FREQUENCY)} |
    ------------------------------------------------------------------------------------------------

    Example:
    ./simulate-events "your-site-id" \\
      --events=${DEFAULT_ARGS.NUMBER_OF_EVENTS} \\
      --users=${DEFAULT_ARGS.NUMBER_OF_USERS} \\
      --days=${DEFAULT_ARGS.SIMULATED_DAYS} \\
      --batch-size=${DEFAULT_ARGS.BATCH_SIZE} \\
      --event-freq=${DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY} \\
      --outbound-freq=${DEFAULT_ARGS.OUTBOUND_LINK_FREQUENCY} \\
      --campaign-freq=${DEFAULT_ARGS.CAMPAIGN_FREQUENCY} \\
      --campaigns=${DEFAULT_ARGS.NUM_CAMPAIGNS} \\
      --referrer-freq=${DEFAULT_ARGS.REFERRER_FREQUENCY}
  `);
  process.exit(1);
}

const getFlag = (name, fallback) => {
  const arg = args.find((arg) => arg.startsWith(`--${name}=`));
  return arg ? parseFloat(arg.split("=")[1]) : fallback;
};

/**
 * Parameters
 */
const SITE_ID = args[0];
const TARGET_URL = "http://127.0.0.1:3001/event";
const NUMBER_OF_EVENTS = getFlag("events", DEFAULT_ARGS.NUMBER_OF_EVENTS);
const NUMBER_OF_USERS = getFlag("users", DEFAULT_ARGS.NUMBER_OF_USERS);
const SIMULATED_DAYS = getFlag("days", DEFAULT_ARGS.SIMULATED_DAYS);
const BATCH_SIZE = getFlag("batch-size", DEFAULT_ARGS.BATCH_SIZE);
const CUSTOM_EVENT_FREQUENCY = getFlag("event-freq", DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY);
const OUTBOUND_LINK_FREQUENCY = getFlag("outbound-freq", DEFAULT_ARGS.OUTBOUND_LINK_FREQUENCY);
const CAMPAIGN_FREQUENCY = getFlag("campaign-freq", DEFAULT_ARGS.CAMPAIGN_FREQUENCY);
const NUM_CAMPAIGNS = getFlag("campaigns", DEFAULT_ARGS.NUM_CAMPAIGNS);
const REFERRER_FREQUENCY = getFlag("referrer-freq", DEFAULT_ARGS.REFERRER_FREQUENCY);

const CUSTOM_EVENTS = [
  {
    event_name: "cart-checkout",
    properties: JSON.stringify({ test_value: 6 }),
  },
  {
    event_name: "product-clicked",
    properties: JSON.stringify({ product_id: "abc123" }),
  },
  {
    event_name: "malformed-props-repro",
    properties: JSON.stringify({ "ran\tdom": "b" }),
  },
];

const OUTBOUND_LINK_URLS = [
  "https://github.com",
  "https://twitter.com",
  "https://linkedin.com",
  "https://youtube.com",
  "https://partner.com",
];

const REFERRER_URLS = [
  "https://duckduckgo.com/",
  "https://www.bing.com/search",
  "https://www.google.com/",
  "https://www.google.com/search",
  "https://news.google.com/",
  "https://www.reddit.com/r/selfhosted/",
  "https://old.reddit.com/r/webdev/",
  "https://news.ycombinator.com/",
  "https://news.ycombinator.com/item?id=39538522",
  "https://github.com/betterlytics/betterlytics",
  "https://t.co/9fKzXqLm",
  "https://www.linkedin.com/feed/",
  "https://www.facebook.com/",
];
/**
 * Weighted device profiles, assigned one per user. The backend derives browser,
 * OS, and their major versions from the user agent, and device type from the
 * screen width, so each profile pairs a real UA string with resolutions from
 * the matching device class. All of these feed the visitor fingerprint, which
 * is why a user keeps the same profile across all of their events.
 */
const DEVICE_PROFILES = [
  { weight: 8, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36", screen_resolutions: ["1920x1080", "2560x1440"] },
  { weight: 6, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", screen_resolutions: ["1920x1080", "1366x768"] },
  { weight: 4, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36", screen_resolutions: ["1536x864", "1366x768"] },
  { weight: 2, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", screen_resolutions: ["1280x800"] },
  { weight: 5, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36", screen_resolutions: ["1440x900", "2560x1440"] },
  { weight: 3, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", screen_resolutions: ["1440x900"] },
  { weight: 4, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0", screen_resolutions: ["1920x1080"] },
  { weight: 2, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0", screen_resolutions: ["1366x768"] },
  { weight: 3, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0", screen_resolutions: ["1920x1080"] },
  { weight: 2, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0", screen_resolutions: ["1440x900"] },
  { weight: 2, user_agent: "Mozilla/5.0 (X11; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0", screen_resolutions: ["1920x1080"] },
  { weight: 1, user_agent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0", screen_resolutions: ["1366x768"] },
  { weight: 4, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", screen_resolutions: ["1440x900", "2560x1440"] },
  { weight: 2, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15", screen_resolutions: ["1280x800"] },
  { weight: 1, user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0", screen_resolutions: ["1920x1080"] },
  { weight: 6, user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", screen_resolutions: ["390x844", "430x932"] },
  { weight: 3, user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", screen_resolutions: ["390x844"] },
  { weight: 2, user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1", screen_resolutions: ["375x812"] },
  { weight: 5, user_agent: "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36", screen_resolutions: ["412x915"] },
  { weight: 3, user_agent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36", screen_resolutions: ["412x915"] },
  { weight: 2, user_agent: "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36", screen_resolutions: ["360x800"] },
  { weight: 2, user_agent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36", screen_resolutions: ["360x780"] },
  { weight: 2, user_agent: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", screen_resolutions: ["820x1180"] },
  { weight: 1, user_agent: "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", screen_resolutions: ["800x1280"] },
];

/**
 * Campaign UTM data for simulating marketing campaigns
 * Note: utm_campaign array is generated dynamically after uuidv4() is defined
 */
const CAMPAIGN_DATA = {
  utm_source: ["google", "facebook", "twitter", "linkedin", "newsletter", "bing", "instagram"],
  utm_medium: ["cpc", "social", "email", "organic", "referral", "display", "affiliate"],
  utm_campaign: [], // populated dynamically below
  utm_term: ["analytics", "dashboard", "tracking", "marketing", "conversion", ""],
  utm_content: ["banner_a", "banner_b", "sidebar", "footer", "hero", ""],
};

const APP_VERSIONS = [
  "v1.0.0", "v1.0.1", "v1.1.0", "v1.2.0", "v1.2.1", "v1.3.0",
  "v2.0.0", "v2.0.1", "v2.1.0", "v2.1.1", "v2.2.0", "v2.3.0", "v2.3.1",
  "v3.0.0-alpha", "v3.0.0-beta", "v3.0.0-rc1", "v3.0.0", "v3.0.1", "v3.1.0",
];

const REGIONS = [
  "us-east", "us-west", "eu-west", "eu-central", "ap-south", "ap-northeast",
  "sa-east", "af-south", "me-south", "ca-central", "ap-southeast",
];

const GLOBAL_PROPERTIES_POOL = [
  { plan: "free", region: "us-east", theme: "light", locale: "en", role: "viewer", app_version: APP_VERSIONS[Math.floor(Math.random() * APP_VERSIONS.length)] },
  { plan: "premium", region: "eu-west", theme: "dark", locale: "de", role: "editor", org_id: "org-acme", app_version: APP_VERSIONS[Math.floor(Math.random() * APP_VERSIONS.length)] },
  { plan: "enterprise", region: "ap-south", theme: "system", locale: "ja", role: "admin", org_id: "org-globex", app_version: APP_VERSIONS[Math.floor(Math.random() * APP_VERSIONS.length)] },
  { plan: "premium", environment: "production", browser_lang: "en-US", signup_source: "google", referral_code: "REF123", team_size: "10", region: REGIONS[Math.floor(Math.random() * REGIONS.length)] },
  { plan: "free", environment: "staging", app_version: "v3.0.0-beta", feature_flags: "beta_ui", onboarding_step: "3", user_tier: "trial", region: REGIONS[Math.floor(Math.random() * REGIONS.length)] },
  { plan: "enterprise", department: "engineering", cost_center: "CC-100", project: "atlas", sprint: "24", priority: "high", region: REGIONS[Math.floor(Math.random() * REGIONS.length)] },
  { plan: "premium", country: "US", currency: "USD", timezone: "America/New_York", device_class: "desktop", connection_type: "wifi", price: 19.99, app_version: APP_VERSIONS[Math.floor(Math.random() * APP_VERSIONS.length)] },
  { plan: "free", app_version: APP_VERSIONS[Math.floor(Math.random() * APP_VERSIONS.length)], score: 4.5, active: true, seats: 1 },
  { plan: "enterprise", app_version: APP_VERSIONS[Math.floor(Math.random() * APP_VERSIONS.length)], score: 87.125, active: false, seats: 250 },
  {},
  {},
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Select element proportionally to its `weight` field
 */
function getWeightedElement(arr) {
  const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of arr) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return arr[arr.length - 1];
}

/**
 * Select element using normal distribution (middle elements more likely)
 */
function getNormalDistributedElement(arr) {
  const index = Math.floor(gaussianRand() * arr.length);
  return arr[Math.min(index, arr.length - 1)];
}

function generateCampaignUrl(baseUrl) {
  const params = new URLSearchParams();
  params.set("utm_source", getRandomElement(CAMPAIGN_DATA.utm_source));
  params.set("utm_medium", getRandomElement(CAMPAIGN_DATA.utm_medium));
  params.set("utm_campaign", getNormalDistributedElement(CAMPAIGN_DATA.utm_campaign));

  const term = getRandomElement(CAMPAIGN_DATA.utm_term);
  if (term) params.set("utm_term", term);

  const content = getRandomElement(CAMPAIGN_DATA.utm_content);
  if (content) params.set("utm_content", content);

  return `${baseUrl}?${params.toString()}`;
}

const PUBLIC_BASE_URL = ENV.PUBLIC_BASE_URL || "http://localhost:3000";

const BASE_PAYLOAD = {
  referrer: null,
  screen_resolution: "1920x1080",
  site_id: SITE_ID,
  event_name: "pageview",
  is_custom_event: false,
  properties: JSON.stringify({}),
  timestamp: 0,
  url: `${PUBLIC_BASE_URL}/dashboard`,
  user_agent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  visitor_id: "placeholder",
};

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

function gaussianRand() {
  var rand = 0;

  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }

  return rand / 6;
}

/**
 * Generates a random public IPv4 address by repeatedly sampling until
 * an address outside of private, reserved, or special-use ranges is found.
 *
 * Excluded CIDR blocks include private, loopback, link-local, multicast,
 * and documentation/test addresses.
 *
 * The excluded CIDRs are from IANA registries
 * - https://www.iana.org/assignments/iana-ipv4-special-registry
 */
function getRandomPublicIp() {
  while (true) {
    const ip = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 256)
    ).join(".");
    if (isPublicIp(ip)) return ip;
  }
}

function isPublicIp(ip) {
  const excludedCidrs = [
    ["10.0.0.0", 8],
    ["172.16.0.0", 12],
    ["192.168.0.0", 16],
    ["127.0.0.0", 8],
    ["0.0.0.0", 8],
    ["169.254.0.0", 16],
    ["224.0.0.0", 4],
    ["192.0.2.0", 24],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["100.64.0.0", 10],
    ["198.18.0.0", 15],
  ];

  return !excludedCidrs.some(([cidrBase, cidrBits]) =>
    ipInCidr(ip, cidrBase, cidrBits)
  );
}

function ipInCidr(ip, cidrBase, cidrBits) {
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(cidrBase);
  const mask = ~(2 ** (32 - cidrBits) - 1);
  return (ipInt & mask) === (baseInt & mask);
}

function ipToInt(ip) {
  return ip.split(".").reduce((int, octet) => (int << 8) + Number(octet), 0);
}

/**
 * Pre-process
 */
console.log("[+] Setting up...");

const users = new Array(NUMBER_OF_USERS).fill(0).map(() => {
  const device = getWeightedElement(DEVICE_PROFILES);
  return {
    visitor_id: uuidv4(),
    ip: getRandomPublicIp(),
    user_agent: device.user_agent,
    screen_resolution: getRandomElement(device.screen_resolutions),
    globalProperties: getRandomElement(GLOBAL_PROPERTIES_POOL),
    referrer:
      Math.random() < REFERRER_FREQUENCY ? getRandomElement(REFERRER_URLS) : null,
  };
});

// Generate unique campaign IDs (short UUIDs)
CAMPAIGN_DATA.utm_campaign = new Array(NUM_CAMPAIGNS)
  .fill(0)
  .map(() => uuidv4().slice(0, 8));

function getExtraPayload(payload) {
  const hasCampaign = Math.random() < CAMPAIGN_FREQUENCY;
  const baseUrl = `${PUBLIC_BASE_URL}/dashboard`;

  // Mutually exclusive event-class roll: outbound_link, custom event, or pageview
  const r = Math.random();
  const isOutboundLink = r < OUTBOUND_LINK_FREQUENCY;
  const isCustomEvent = !isOutboundLink && r < OUTBOUND_LINK_FREQUENCY + CUSTOM_EVENT_FREQUENCY;

  return {
    ...payload,
    url: hasCampaign ? generateCampaignUrl(baseUrl) : baseUrl,
    ...(isOutboundLink
      ? {
          event_name: "outbound_link",
          outbound_link_url: getRandomElement(OUTBOUND_LINK_URLS),
        }
      : isCustomEvent
      ? {
          ...CUSTOM_EVENTS[Math.floor(Math.random() * CUSTOM_EVENTS.length)],
          is_custom_event: true,
        }
      : {}),
  };
}

const usersByVisitorId = new Map(users.map((u) => [u.visitor_id, u]));

const events = new Array(NUMBER_OF_EVENTS)
  .fill(0)
  .map(() => {
    const daysAgo =
      SIMULATED_DAYS === 0
        ? 0
        : Math.floor(Math.random() * SIMULATED_DAYS) + gaussianRand(); // same logic

    const secondsAgo = Math.floor(daysAgo * 86400);
    const timestamp = Math.floor(Date.now() / 1000 - secondsAgo);

    const user = users[Math.floor(Math.random() * users.length)];
    return {
      timestamp,
      visitor_id: user.visitor_id,
      user_ip: user.ip,
    };
  })
  .sort((a, b) => a.timestamp - b.timestamp)
  .map((payload) => getExtraPayload(payload))
  .map((payload) => {
    const user = usersByVisitorId.get(payload.visitor_id);
    const gp = user?.globalProperties ?? {};
    return {
      ...BASE_PAYLOAD,
      ...payload,
      user_agent: user?.user_agent ?? BASE_PAYLOAD.user_agent,
      screen_resolution: user?.screen_resolution ?? BASE_PAYLOAD.screen_resolution,
      referrer: user?.referrer ?? null,
      ...(Object.keys(gp).length > 0 ? { global_properties: gp } : {}),
    };
  });

console.log("[+] Running...");
console.time("events");

function* toBatches(array, batchSize) {
  for (let i = 0; i < array.length; i += batchSize) {
    yield array.slice(i, i + batchSize);
  }
}

async function executeBatches(batches) {
  for (const batch of batches) {
    await Promise.all(
      batch.map((event) =>
        fetch(TARGET_URL, {
          method: "POST",
          body: JSON.stringify(event),
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": event.user_ip,
          },
        })
      )
    );
  }
}

executeBatches([...toBatches(events, BATCH_SIZE)]).then(() => {
  console.timeEnd("events");
  console.log("[+] Completed!");
});
