'use server';

import {
  CreateFunnelSchema,
  type FunnelStep,
  UpdateFunnelSchema,
  UpdateFunnel,
} from '@/entities/analytics/funnels.entities';
import {
  createFunnelForDashboard,
  deleteFunnelFromDashboard,
  updateFunnelForDashboard,
} from '@/services/analytics/funnels.service';
import { withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';

export const postFunnelAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, name: string, funnelSteps: FunnelStep[], isStrict: boolean) => {
    const funnel = CreateFunnelSchema.parse({
      dashboardId: ctx.dashboardId,
      name,
      funnelSteps,
      isStrict,
    });
    return createFunnelForDashboard(funnel);
  },
);

export const deleteFunnelAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, funnelId: string): Promise<void> => {
    await deleteFunnelFromDashboard(ctx.dashboardId, funnelId);
  },
);

export const updateFunnelAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, data: UpdateFunnel): Promise<void> => {
    const validatedData = UpdateFunnelSchema.parse(data);
    await updateFunnelForDashboard(ctx.dashboardId, validatedData);
  },
);
