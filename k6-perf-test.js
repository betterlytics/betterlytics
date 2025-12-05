import http from "k6/http";
import { check } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const targetUrl = __ENV.TARGET_URL || "http://localhost:3001/event";
const VUS = parseInt(__ENV.VUS || "100");
const DURATION = __ENV.DURATION || "1m";

const basePayload = {
  referrer: null,
  screen_resolution: "1920x1080",
  site_id: "default-site",
  event_name: "pageview",
  is_custom_event: false,
  properties: JSON.stringify({}),
  timestamp: 0,
  url: "http://localhost:3000/dashboard",
  user_agent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  visitor_id: "placeholder",
};

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<100"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  const uniqueVisitorId = uuidv4();

  const payloadToSend = {
    ...basePayload,
    timestamp: Math.floor(Date.now() / 1000),
    visitor_id: uniqueVisitorId,
  };

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(targetUrl, JSON.stringify(payloadToSend), params);

  check(res, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
  });
}
