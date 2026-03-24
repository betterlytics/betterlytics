import { z } from 'zod';

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
  expiresAt: true,
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
});

export type McpToken = z.infer<typeof McpTokenSchema>;
export type McpTokenListItem = z.infer<typeof McpTokenListItemSchema>;
export type McpTokenWithDashboard = z.infer<typeof McpTokenWithDashboardSchema>;
export type CreateMcpTokenData = z.infer<typeof CreateMcpTokenSchema>;
