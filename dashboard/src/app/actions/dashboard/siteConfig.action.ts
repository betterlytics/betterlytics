'use server';

import { withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { SiteConfigUpdateSchema, type SiteConfigUpdate } from '@/entities/dashboard/siteConfig.entities';
import { getSiteConfig, saveSiteConfig } from '@/services/dashboard/siteConfig.service';

export const getSiteConfigAction = withDashboardMutationAuthContext(async (ctx: AuthContext) => {
  return await getSiteConfig(ctx.dashboardId);
});

export const saveSiteConfigAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, updates: SiteConfigUpdate) => {
    const validated = SiteConfigUpdateSchema.parse(updates);
    return await saveSiteConfig(ctx.dashboardId, validated);
  },
);
