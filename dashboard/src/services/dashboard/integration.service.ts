'server-only';

import {
  Integration,
  IntegrationType,
  IntegrationConfigSchemas,
} from '@/entities/dashboard/integration.entities';
import * as IntegrationRepository from '@/repositories/postgres/integration.repository';

export async function getIntegrations(dashboardId: string): Promise<Integration[]> {
  try {
    return await IntegrationRepository.findIntegrationsByDashboardId(dashboardId);
  } catch (error) {
    console.error('Error getting integrations:', error);
    throw new Error('Failed to get integrations');
  }
}

export async function getIntegration(
  dashboardId: string,
  type: IntegrationType,
): Promise<Integration | null> {
  try {
    return await IntegrationRepository.findIntegrationByType(dashboardId, type);
  } catch (error) {
    console.error('Error getting integration:', error);
    throw new Error('Failed to get integration');
  }
}

export async function saveIntegration(
  dashboardId: string,
  type: IntegrationType,
  config: Record<string, unknown>,
  name?: string | null,
): Promise<Integration> {
  try {
    const configSchema = IntegrationConfigSchemas[type];
    configSchema.parse(config);

    const existing = await IntegrationRepository.findIntegrationByType(dashboardId, type);

    if (existing) {
      return await IntegrationRepository.updateIntegration(dashboardId, type, {
        config,
        name: name ?? existing.name,
      });
    }

    return await IntegrationRepository.createIntegration({
      dashboardId,
      type,
      config,
      name,
    });
  } catch (error) {
    console.error('Error saving integration:', error);
    throw new Error('Failed to save integration');
  }
}

export async function deleteIntegration(
  dashboardId: string,
  type: IntegrationType,
): Promise<void> {
  try {
    await IntegrationRepository.deleteIntegration(dashboardId, type);
  } catch (error) {
    console.error('Error deleting integration:', error);
    throw new Error('Failed to delete integration');
  }
}

export async function toggleIntegration(
  dashboardId: string,
  type: IntegrationType,
  enabled: boolean,
): Promise<Integration> {
  try {
    return await IntegrationRepository.updateIntegration(dashboardId, type, { enabled });
  } catch (error) {
    console.error('Error toggling integration:', error);
    throw new Error('Failed to toggle integration');
  }
}
