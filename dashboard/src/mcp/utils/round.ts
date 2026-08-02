/**
 * Rounds a nullable metric for MCP responses. Raw ClickHouse averages carry far more precision than
 * an agent can use, and the extra digits are pure token cost in the JSON payload.
 */
export function round(value: number | null | undefined, decimals: number): number | null {
  if (value == null) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
