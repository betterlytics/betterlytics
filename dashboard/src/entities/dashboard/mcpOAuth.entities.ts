import { z } from 'zod';
import { DashboardRole } from '@prisma/client';

export const DashboardMembershipSchema = z.object({
  dashboardId: z.string(),
  siteId: z.string(),
  domain: z.string(),
  role: z.nativeEnum(DashboardRole),
  // off when the dashboard's owners or admins turned AI access off: no agent or token reads it
  aiAccessEnabled: z.boolean(),
});

export const McpGrantSelectionSchema = z
  .object({
    allDashboards: z.boolean(),
    dashboardIds: z.array(z.string().min(1)).max(1000),
    // under All dashboards, the ones owners or admins removed that the member left out; ignored otherwise
    excludedDashboardIds: z.array(z.string().min(1)).max(1000).optional(),
  })
  .refine((selection) => selection.allDashboards || selection.dashboardIds.length > 0, {
    message: 'Pick at least one dashboard',
  });

export const McpConsentGrantSchema = z.object({
  consentId: z.string(),
  // reconnecting after a revoke creates a new consent, so tokens issued before this belong to the revoked one
  createdAt: z.date().nullable(),
  // null when the consent was stored without a grant, which reads no dashboards
  grant: z
    .object({
      allDashboards: z.boolean(),
      dashboardIds: z.array(z.string()),
      // removed by an owner or admin from an All dashboards grant, which keeps covering the others
      excludedDashboardIds: z.array(z.string()),
    })
    .nullable(),
});

export const OauthClientDetailsSchema = z.object({
  clientId: z.string(),
  name: z.string().nullable(),
  icon: z.string().nullable(),
  redirectUris: z.array(z.string()),
  // registered from a Client ID Metadata Document, whose host vouches for it; otherwise through open DCR
  discovered: z.boolean(),
  disabled: z.boolean(),
});

// One per user and OAuth client: the latest consent, as findMcpConsentGrant reads it on every call
export const McpConnectionRecordSchema = z.object({
  consentId: z.string(),
  client: OauthClientDetailsSchema.omit({ icon: true, disabled: true }),
  scopes: z.array(z.string()),
  // when the user last approved the client on the consent page; better-auth always sets it
  connectedAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  grant: McpConsentGrantSchema.shape.grant,
});

// An OAuth connection that can read a dashboard, as its owners and admins see it: only the link to that dashboard
export const DashboardMcpConnectionRecordSchema = z.object({
  consentId: z.string(),
  client: OauthClientDetailsSchema.pick({ clientId: true, name: true, redirectUris: true, discovered: true }),
  member: z.object({
    name: z.string().nullable(),
    email: z.string(),
  }),
  connectedAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
});

export type DashboardMembership = z.infer<typeof DashboardMembershipSchema>;
export type McpGrantSelection = z.infer<typeof McpGrantSelectionSchema>;
export type McpConsentGrant = z.infer<typeof McpConsentGrantSchema>;
export type OauthClientDetails = z.infer<typeof OauthClientDetailsSchema>;
export type McpConnectionRecord = z.infer<typeof McpConnectionRecordSchema>;
export type DashboardMcpConnectionRecord = z.infer<typeof DashboardMcpConnectionRecordSchema>;
