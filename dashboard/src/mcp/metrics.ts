import { Counter, Histogram } from 'prom-client';

export const mcpToolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of MCP tool invocations',
  labelNames: ['tool', 'status'] as const,
});

export const mcpToolDurationSeconds = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'Duration of MCP tool invocations in seconds',
  labelNames: ['tool', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const mcpRateLimitHitsTotal = new Counter({
  name: 'mcp_rate_limit_hits_total',
  help: 'Total number of MCP requests rejected by the per-site rate limiter',
});
