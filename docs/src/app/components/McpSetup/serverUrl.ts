export const CLOUD_MCP_SERVER_URL = "https://betterlytics.io/api/mcp";
const MCP_PATH = "/api/mcp";

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase());
}

// Without a scheme, loopback hosts get http (selfhost local mode serves plain http), everything else https.
function withScheme(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const asHttp = new URL(`http://${value}`);
  return isLoopbackHostname(asHttp.hostname) ? asHttp.href : `https://${value}`;
}

// Accepts an instance origin or any dashboard URL on it; only the origin is kept since the dashboard has no basePath.
export function resolveServerUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return CLOUD_MCP_SERVER_URL;
  try {
    return `${new URL(withScheme(trimmed)).origin}${MCP_PATH}`;
  } catch {
    return CLOUD_MCP_SERVER_URL;
  }
}

// mcp-remote refuses plain-http URLs on non-loopback hosts unless --allow-http is passed.
export function needsAllowHttp(serverUrl: string): boolean {
  const url = new URL(serverUrl);
  return url.protocol === "http:" && !isLoopbackHostname(url.hostname);
}
