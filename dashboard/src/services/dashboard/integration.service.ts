'server-only';

import {
  Integration,
  IntegrationType,
  IntegrationConfigSchemas,
} from '@/entities/dashboard/integration.entities';
import * as IntegrationRepository from '@/repositories/postgres/integration.repository';
import { symmetricEncrypt, symmetricDecrypt } from '@/lib/crypto';
import { env } from '@/lib/env';

const ENCRYPTION_KEY = env.NEXTAUTH_SECRET;

function encryptConfig(config: Record<string, unknown>): Record<string, unknown> {
  const encrypted = symmetricEncrypt(JSON.stringify(config), ENCRYPTION_KEY);
  return { encrypted };
}

function decryptConfig(config: Record<string, unknown>): Record<string, unknown> {
  if ('encrypted' in config && typeof config.encrypted === 'string') {
    return JSON.parse(symmetricDecrypt(config.encrypted, ENCRYPTION_KEY));
  }
  return config;
}

function decryptIntegration(integration: Integration): Integration {
  return { ...integration, config: decryptConfig(integration.config) };
}

type IntegrationValidator = (
  config: Record<string, unknown>,
) => Promise<string | null>;

const integrationValidators: Partial<Record<IntegrationType, IntegrationValidator>> = {
  pushover: async (config) => {
    if (typeof config.userKey !== 'string') return 'invalid_pushover_key';
    const isValid = await validatePushoverUserKey(config.userKey);
    return isValid ? null : 'invalid_pushover_key';
  },
};

export async function validateIntegrationConfig(
  type: IntegrationType,
  config: Record<string, unknown>,
): Promise<string | null> {
  const validator = integrationValidators[type];
  if (!validator) return null;
  return validator(config);
}

export async function getIntegrations(dashboardId: string): Promise<Integration[]> {
  try {
    const integrations = await IntegrationRepository.findIntegrationsByDashboardId(dashboardId);
    return integrations.map(decryptIntegration);
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
    const integration = await IntegrationRepository.findIntegrationByType(dashboardId, type);
    if (!integration) return null;
    return decryptIntegration(integration);
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

    const encryptedConfig = encryptConfig(config);
    const existing = await IntegrationRepository.findIntegrationByType(dashboardId, type);

    let result: Integration;
    if (existing) {
      result = await IntegrationRepository.updateIntegration(dashboardId, type, {
        config: encryptedConfig,
        name: name ?? existing.name,
      });
    } else {
      result = await IntegrationRepository.createIntegration({
        dashboardId,
        type,
        config: encryptedConfig,
        name,
      });
    }

    return decryptIntegration(result);
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
    const result = await IntegrationRepository.updateIntegration(dashboardId, type, { enabled });
    return decryptIntegration(result);
  } catch (error) {
    console.error('Error toggling integration:', error);
    throw new Error('Failed to toggle integration');
  }
}

export async function validatePushoverUserKey(userKey: string): Promise<boolean> {
  if (!env.PUSHOVER_APP_TOKEN) return false;

  try {
    const response = await fetch('https://api.pushover.net/1/users/validate.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: env.PUSHOVER_APP_TOKEN,
        user: userKey,
      }),
    });

    const data = await response.json();
    return data.status === 1;
  } catch (error) {
    console.error('Error validating Pushover user key:', error);
    return false;
  }
}
