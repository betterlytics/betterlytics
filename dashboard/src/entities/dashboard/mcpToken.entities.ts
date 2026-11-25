import { z } from 'zod';

export const MCP_TOKEN_LIFETIME_DAYS = { '30d': 30, '90d': 90, '180d': 180 } as const;
export const McpTokenLifetimeSchema = z.enum(['30d', '90d', '180d', 'never']);
export type McpTokenLifetime = z.infer<typeof McpTokenLifetimeSchema>;
export const DEFAULT_MCP_TOKEN_LIFETIME: McpTokenLifetime = '90d';

export const McpTokenNameSchema = z.string().trim().min(1).max(100);
export const McpTokenDashboardIdsSchema = z.array(z.string().min(1)).min(1).max(1000);

export const McpTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
});

// the picked dashboards as stored, before they are checked against the creator's memberships
export const PersonalMcpTokenRecordSchema = McpTokenSchema.extend({
  dashboardIds: z.array(z.string()),
});

export const McpTokenCredentialSchema = z.object({
  id: z.string(),
  createdBy: z.string(),
  expiresAt: z.date().nullable(),
  dashboardIds: z.array(z.string()),
});

export const DashboardMcpTokenSchema = McpTokenSchema.extend({
  creator: z.object({
    name: z.string().nullable(),
    email: z.string(),
  }),
});

export const CreateMcpTokenSchema = z.object({
  name: McpTokenNameSchema,
  createdBy: z.string(),
  dashboardIds: McpTokenDashboardIdsSchema,
  expiresAt: z.date().nullable(),
});

export type McpToken = z.infer<typeof McpTokenSchema>;
export type PersonalMcpTokenRecord = z.infer<typeof PersonalMcpTokenRecordSchema>;
export type McpTokenCredential = z.infer<typeof McpTokenCredentialSchema>;
export type DashboardMcpToken = z.infer<typeof DashboardMcpTokenSchema>;
export type CreateMcpTokenData = z.infer<typeof CreateMcpTokenSchema>;
