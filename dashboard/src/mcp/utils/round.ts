/**
 * Rounds a nullable metric for MCP responses. Raw ClickHouse averages carry far more precision than
 * an agent can use, and the extra digits are pure token cost in the JSON payload.
 */
export function round(value: number | null | undefined, decimals: number): number | null {
  if (value == null) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Rounds an uptime percentage down, as the dashboard and status page show it, so 99.9996% never
 * reads as 100. The epsilon keeps float noise like 99.98999999 from dropping a digit.
 */
export function floorUptime(value: number | null | undefined, decimals: number): number | null {
  if (value == null) return null;
  const factor = 10 ** decimals;
  return Math.floor(value * factor + 1e-7) / factor;
}
