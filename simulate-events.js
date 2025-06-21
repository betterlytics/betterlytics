/**
 * Parameters
 */
const SITE_ID = "";
const TARGET_URL = "http://localhost:3001/track";
const NUMBER_OF_EVENTS = 20_000;
const NUMBER_OF_USERS = 5000;
const SIMULATED_DAYS = 20;
const BATCH_SIZE = 1_000;
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
const CUSTOM_EVENT_FREQUENCY = 0.2;
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

/**
 * Pre-process
 */
console.log("[+] Setting up...");

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

const userIds = new Array(NUMBER_OF_USERS).fill(0).map((_) => uuidv4());

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
  .map((_) => 86400 * Math.floor(Math.random() * SIMULATED_DAYS))
  .map((day) => day + 86400 * gaussianRand())
  .map((stamp) => Math.floor(Date.now() / 1000 - stamp))
  .sort()
  .map((timestamp) => ({
    timestamp,
    visitor_id: userIds[Math.floor(userIds.length * Math.random())],
    screen_resolution:
      SCREEN_SIZES[Math.floor(SCREEN_SIZES.length * Math.random())],
  }))
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
