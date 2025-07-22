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
    ----------------------------------------------------------------------------------------
    | Flag           | Description                                              | Default  |
    | -------------- | -------------------------------------------------------- | -------- |
    | '--events'     | Total number of events to simulate                       | ${formatNumber(DEFAULT_ARGS.NUMBER_OF_EVENTS)} |
    | '--users'      | Number of unique simulated users                         | ${formatNumber(DEFAULT_ARGS.NUMBER_OF_USERS)} |
    | '--batch-size' | Number of events sent per batch (concurrent POSTs)       | ${formatNumber(DEFAULT_ARGS.BATCH_SIZE)} |
    | '--event-freq' | Fraction (0–1) of events that are custom (non-pageview)  | ${formatNumber(DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY)} |
    ----------------------------------------------------------------------------------------

    Example:
    ./simulate-events "your-site-id" \\
      --events=${DEFAULT_ARGS.NUMBER_OF_EVENTS} \\
      --users=${DEFAULT_ARGS.NUMBER_OF_USERS} \\
      --batch-size=${DEFAULT_ARGS.BATCH_SIZE} \\
      --event-freq=${DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY}
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
const TARGET_URL = "http://127.0.0.1:3001/track";
const NUMBER_OF_EVENTS = getFlag("events", DEFAULT_ARGS.NUMBER_OF_EVENTS);
const NUMBER_OF_USERS = getFlag("users", DEFAULT_ARGS.NUMBER_OF_USERS);
const SIMULATED_DAYS = 0; /** Not supported on the backend for now */
const BATCH_SIZE = getFlag("batch-size", DEFAULT_ARGS.BATCH_SIZE);
const CUSTOM_EVENT_FREQUENCY = getFlag("event-freq", DEFAULT_ARGS.CUSTOM_EVENT_FREQUENCY);

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

const BASE_PAYLOAD = {
  referrer: null,
  screen_resolution: "1920x1080",
  site_id: SITE_ID,
  event_name: "pageview",
  is_custom_event: false,
  properties: JSON.stringify({}),
  timestamp: 0,
  url: "http://localhost:3000/dashboard",
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
    const ip = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
    if (isPublicIp(ip)) return ip;
  }
}

function isPublicIp(ip) {
  const excludedCidrs = [
    ['10.0.0.0', 8],
    ['172.16.0.0', 12],
    ['192.168.0.0', 16],
    ['127.0.0.0', 8],
    ['0.0.0.0', 8],
    ['169.254.0.0', 16],
    ['224.0.0.0', 4],
    ['192.0.2.0', 24],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['100.64.0.0', 10],
    ['198.18.0.0', 15],
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
  return ip.split('.').reduce((int, octet) => (int << 8) + Number(octet), 0);
}

/**
 * Pre-process
 */
console.log("[+] Setting up...");

const users = new Array(NUMBER_OF_USERS).fill(0).map(() => ({
  visitor_id: uuidv4(),
  ip: getRandomPublicIp(),
}));

function getExtraPayload(payload) {
  return {
    ...payload,
    ...(Math.random() < CUSTOM_EVENT_FREQUENCY
      ? {
          ...CUSTOM_EVENTS[Math.floor(Math.random() * CUSTOM_EVENTS.length)],
          is_custom_event: true,
        }
      : {}),
  };
}

const events = new Array(NUMBER_OF_EVENTS)
  .fill(0)
  .map(() => {
    const daysAgo = SIMULATED_DAYS === 0
      ? 0
      : Math.floor(Math.random() * SIMULATED_DAYS) + gaussianRand(); // same logic

    const secondsAgo = Math.floor(daysAgo * 86400);
    const timestamp = Math.floor(Date.now() / 1000 - secondsAgo);

    const user = users[Math.floor(Math.random() * users.length)];
    return {
      timestamp,
      visitor_id: user.visitor_id,
      user_ip: user.ip,
      screen_resolution: SCREEN_SIZES[Math.floor(Math.random() * SCREEN_SIZES.length)],
    };
  })
  .sort((a, b) => a.timestamp - b.timestamp)
  .map((payload) => getExtraPayload(payload))
  .map((payload) => ({ ...BASE_PAYLOAD, ...payload }));

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
