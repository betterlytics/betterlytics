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
  CAMPAIGN_FREQUENCY: 0.3,
  NUM_CAMPAIGNS: 6,
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
    | '--campaign-freq'| Fraction (0–1) of events that have campaign UTM tags       | ${formatNumber(DEFAULT_ARGS.CAMPAIGN_FREQUENCY)} |
    | '--campaigns'    | Number of unique campaigns to generate                     | ${formatNumber(DEFAULT_ARGS.NUM_CAMPAIGNS)} |
    ------------------------------------------------------------------------------------------------

    Example:
    ./simulate-events "your-site-id" \\
      --events=${DEFAULT_ARGS.NUMBER_OF_EVENTS} \\
      --users=${DEFAULT_ARGS.NUMBER_OF_USERS} \\
      --days=${DEFAULT_ARGS.SIMULATED_DAYS} \\
      --batch-size=${DEFAULT_ARGS.BATCH_SIZE} \\
      --event-freq=${DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY} \\
      --campaign-freq=${DEFAULT_ARGS.CAMPAIGN_FREQUENCY} \\
      --campaigns=${DEFAULT_ARGS.NUM_CAMPAIGNS}
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
const CAMPAIGN_FREQUENCY = getFlag("campaign-freq", DEFAULT_ARGS.CAMPAIGN_FREQUENCY);
const NUM_CAMPAIGNS = getFlag("campaigns", DEFAULT_ARGS.NUM_CAMPAIGNS);

const CUSTOM_EVENTS = [
  {
    event_name: "cart-checkout",
    properties: JSON.stringify({ test_value: 6 }),
  },
  {
    event_name: "product-clicked",
    properties: JSON.stringify({ product_id: "abc123" }),
  },
];
const SCREEN_SIZES = ["1920x1080", "900x400", "500x300"];

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

const users = new Array(NUMBER_OF_USERS).fill(0).map(() => ({
  visitor_id: uuidv4(),
  ip: getRandomPublicIp(),
  globalProperties: getRandomElement(GLOBAL_PROPERTIES_POOL),
}));

// Generate unique campaign IDs (short UUIDs)
CAMPAIGN_DATA.utm_campaign = new Array(NUM_CAMPAIGNS)
  .fill(0)
  .map(() => uuidv4().slice(0, 8));

function getExtraPayload(payload) {
  const hasCampaign = Math.random() < CAMPAIGN_FREQUENCY;
  const baseUrl = `${PUBLIC_BASE_URL}/dashboard`;

  return {
    ...payload,
    url: hasCampaign ? generateCampaignUrl(baseUrl) : baseUrl,
    ...(Math.random() < CUSTOM_EVENT_FREQUENCY
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
      screen_resolution:
        SCREEN_SIZES[Math.floor(Math.random() * SCREEN_SIZES.length)],
    };
  })
  .sort((a, b) => a.timestamp - b.timestamp)
  .map((payload) => getExtraPayload(payload))
  .map((payload) => {
    const gp = usersByVisitorId.get(payload.visitor_id)?.globalProperties ?? {};
    return {
      ...BASE_PAYLOAD,
      ...payload,
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
