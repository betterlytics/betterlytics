import { z } from 'zod';

export const MCP_TOKEN_LIFETIME_DAYS = { '30d': 30, '90d': 90, '180d': 180 } as const;
export const McpTokenLifetimeSchema = z.enum(['30d', '90d', '180d', 'never']);
export type McpTokenLifetime = z.infer<typeof McpTokenLifetimeSchema>;
export const DEFAULT_MCP_TOKEN_LIFETIME: McpTokenLifetime = '90d';

export const McpTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  dashboardId: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
});

export const McpTokenListItemSchema = McpTokenSchema.omit({
  createdBy: true,
});

export const McpTokenWithDashboardSchema = McpTokenSchema.extend({
  tokenHash: z.string(),
  dashboard: z.object({
    siteId: z.string(),
  }),
});

export const CreateMcpTokenSchema = z.object({
  dashboardId: z.string(),
  name: z.string().min(1),
  createdBy: z.string(),
  expiresAt: z.date().nullable(),
});

export type McpToken = z.infer<typeof McpTokenSchema>;
export type McpTokenListItem = z.infer<typeof McpTokenListItemSchema>;
export type McpTokenWithDashboard = z.infer<typeof McpTokenWithDashboardSchema>;
export type CreateMcpTokenData = z.infer<typeof CreateMcpTokenSchema>;
