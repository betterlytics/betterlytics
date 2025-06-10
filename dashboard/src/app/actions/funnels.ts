'use server';

import { type Funnel, CreateFunnelSchema, type FunnelDetails, type FunnelPreview } from '@/entities/funnels';
import {
  createFunnelForDashboard,
  getFunnelDetailsById,
  getFunnelPreviewData,
  getFunnelsByDashboardId,
} from '@/services/funnels';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/authContext';
import { type QueryFilter } from '@/entities/filter';
import { revalidatePath } from 'next/cache';

export const postFunnelAction = withDashboardAuthContext(
  async (ctx: AuthContext, name: string, queryFilters: QueryFilter[], isStrict: boolean): Promise<Funnel> => {
    const funnel = CreateFunnelSchema.parse({
      dashboardId: ctx.dashboardId,
      name,
      queryFilters,
      isStrict,
    });
    revalidatePath(`/dashboard/${ctx.dashboardId}/funnels`);
    return createFunnelForDashboard(funnel);
  },
);

export const fetchFunnelDetailsAction = withDashboardAuthContext(
  async (ctx: AuthContext, funnelId: string): Promise<FunnelDetails> => {
    const funnel = await getFunnelDetailsById(ctx.siteId, funnelId);
    if (funnel === null) {
      throw new Error('Funnel not found');
    }

    return funnel;
  },
);

export const fetchFunnelsAction = withDashboardAuthContext(async (ctx: AuthContext): Promise<FunnelDetails[]> => {
  return getFunnelsByDashboardId(ctx.dashboardId, ctx.siteId);
});

export const fetchFunnelPreviewAction = withDashboardAuthContext(
  async (ctx: AuthContext, queryFilters: QueryFilter[], isStrict: boolean): Promise<FunnelPreview> => {
    return getFunnelPreviewData(ctx.siteId, queryFilters, isStrict);
  },
);
