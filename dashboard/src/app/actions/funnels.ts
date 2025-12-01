'use server';

import {
  type Funnel,
  CreateFunnelSchema,
  type FunnelStep,
  UpdateFunnelSchema,
  UpdateFunnel,
} from '@/entities/funnels';
import {
  createFunnelForDashboard,
  getFunnelDetailsById,
  getFunnelPreviewData,
  getFunnelsByDashboardId,
  deleteFunnelFromDashboard,
  updateFunnelForDashboard,
} from '@/services/funnels';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/authContext';
import { revalidatePath } from 'next/cache';
import { toFunnel } from '@/presenters/toFunnel';

export const postFunnelAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, name: string, funnelSteps: FunnelStep[], isStrict: boolean) => {
    const funnel = CreateFunnelSchema.parse({
      dashboardId: ctx.dashboardId,
      name,
      funnelSteps,
      isStrict,
    });
    revalidatePath(`/dashboard/${ctx.dashboardId}/funnels`);
    return createFunnelForDashboard(funnel);
  },
);

export const fetchFunnelDetailsAction = withDashboardAuthContext(
  async (ctx: AuthContext, funnelId: string, startDate: Date, endDate: Date) => {
    const funnel = await getFunnelDetailsById(ctx.siteId, funnelId, startDate, endDate);
    if (funnel === null) {
      throw new Error('Funnel not found');
    }

    return toFunnel(funnel);
  },
);

export const fetchFunnelsAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date) => {
    const funnels = await getFunnelsByDashboardId(ctx.dashboardId, ctx.siteId, startDate, endDate);

    return funnels.map((funnel) => ({
      stepCount: funnel.funnelSteps.length,
      ...toFunnel(funnel),
    }));
  },
);

export const fetchFunnelPreviewAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, funnelSteps: FunnelStep[], isStrict: boolean) => {
    const funnelPreview = await getFunnelPreviewData(ctx.siteId, startDate, endDate, funnelSteps, isStrict);

    return toFunnel(funnelPreview);
  },
);

export const deleteFunnelAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, funnelId: string): Promise<void> => {
    await deleteFunnelFromDashboard(ctx.dashboardId, funnelId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/funnels`);
  },
);

export const updateFunnelAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, data: UpdateFunnel): Promise<void> => {
    const validatedData = UpdateFunnelSchema.parse(data);
    await updateFunnelForDashboard(validatedData);
    revalidatePath(`/dashboard/${ctx.dashboardId}/funnels`);
  },
);
