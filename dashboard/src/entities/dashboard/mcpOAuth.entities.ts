import { z } from 'zod';
import { DashboardRole } from '@prisma/client';

export const DashboardMembershipSchema = z.object({
  dashboardId: z.string(),
  siteId: z.string(),
  domain: z.string(),
  role: z.nativeEnum(DashboardRole),
});

export const McpGrantSelectionSchema = z
  .object({
    allDashboards: z.boolean(),
    dashboardIds: z.array(z.string().min(1)).max(1000),
  })
  .refine((selection) => selection.allDashboards || selection.dashboardIds.length > 0, {
    message: 'Pick at least one dashboard',
  });

export const McpConsentGrantSchema = z.object({
  consentId: z.string(),
  // null when the consent was stored without a grant, which reads no dashboards
  grant: z
    .object({
      allDashboards: z.boolean(),
      dashboardIds: z.array(z.string()),
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

export type DashboardMembership = z.infer<typeof DashboardMembershipSchema>;
export type McpGrantSelection = z.infer<typeof McpGrantSelectionSchema>;
export type McpConsentGrant = z.infer<typeof McpConsentGrantSchema>;
export type OauthClientDetails = z.infer<typeof OauthClientDetailsSchema>;
