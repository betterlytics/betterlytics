'use server';

import { Integration, IntegrationType } from '@/entities/dashboard/integration.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import * as IntegrationService from '@/services/dashboard/integration.service';
import { revalidatePath } from 'next/cache';
import { env } from '@/lib/env';

const integrationAvailability: Record<IntegrationType, () => boolean> = {
  pushover: () => !!env.PUSHOVER_APP_TOKEN,
  discord: () => true
};

export const getAvailableIntegrationTypesAction = withDashboardAuthContext(
  async (): Promise<IntegrationType[]> => {
    return (Object.entries(integrationAvailability) as [IntegrationType, () => boolean][])
      .filter(([, isAvailable]) => isAvailable())
      .map(([type]) => type);
  },
);

export const getIntegrationsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<Integration[]> => {
    return await IntegrationService.getIntegrations(ctx.dashboardId);
  },
);

type SaveIntegrationResult =
  | { success: true; integration: Integration }
  | { success: false; error: string };

export const saveIntegrationAction = withDashboardMutationAuthContext(
  async (
    ctx: AuthContext,
    type: IntegrationType,
    config: Record<string, unknown>,
    name?: string | null,
  ): Promise<SaveIntegrationResult> => {
    const validationError = await IntegrationService.validateIntegrationConfig(type, config);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const result = await IntegrationService.saveIntegration(ctx.dashboardId, type, config, name);
      revalidatePath(`/dashboard/${ctx.dashboardId}/settings/integrations`);
      return { success: true, integration: result };
    } catch {
      return { success: false, error: 'unknown' };
    }
  },
  { permission: 'canManageSettings' },
);

export const deleteIntegrationAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, type: IntegrationType): Promise<void> => {
    await IntegrationService.deleteIntegration(ctx.dashboardId, type);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/integrations`);
  },
  { permission: 'canManageSettings' },
);

export const toggleIntegrationAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, type: IntegrationType, enabled: boolean): Promise<Integration> => {
    const result = await IntegrationService.toggleIntegration(ctx.dashboardId, type, enabled);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/integrations`);
    return result;
  },
  { permission: 'canManageSettings' },
);
