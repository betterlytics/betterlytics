'server-only';

import {
  Integration,
  IntegrationConfig,
  IntegrationConfigInput,
  IntegrationType,
  IntegrationConfigSchemas,
} from '@/entities/dashboard/integration.entities';
import * as IntegrationRepository from '@/repositories/postgres/integration.repository';
import { symmetricEncrypt, symmetricDecrypt } from '@/lib/crypto';
import { env } from '@/lib/env';

const ENCRYPTION_KEY = env.INTEGRATION_ENCRYPTION_KEY;

function encryptConfig(config: IntegrationConfig): { encrypted: string } {
  const encrypted = symmetricEncrypt(JSON.stringify(config), ENCRYPTION_KEY);
  return { encrypted };
}

function decryptConfig(config: { encrypted: string }): IntegrationConfig {
  return JSON.parse(symmetricDecrypt(config.encrypted, ENCRYPTION_KEY));
}

function decryptIntegration(integration: Integration): Integration {
  return { ...integration, config: decryptConfig(integration.config as { encrypted: string }) };
}

const MASK_CHAR = '•';
const VISIBLE_CHARS = 4;

const SECRET_FIELDS: Record<IntegrationType, string[]> = {
  pushover: ['userKey'],
  discord: ['webhookUrl'],
  slack: ['webhookUrl'],
  teams: ['webhookUrl'],
  webhook: ['webhookUrl'],
};

function maskSecret(value: string): string {
  if (value.length <= VISIBLE_CHARS) return MASK_CHAR.repeat(value.length);
  return MASK_CHAR.repeat(value.length - VISIBLE_CHARS) + value.slice(-VISIBLE_CHARS);
}

function maskIntegration(integration: Integration): Integration {
  const config = { ...integration.config };
  for (const field of SECRET_FIELDS[integration.type as IntegrationType] ?? []) {
    if (typeof config[field] === 'string') {
      config[field] = maskSecret(config[field]);
    }
  }
  return { ...integration, config };
}

type IntegrationValidator = (config: IntegrationConfigInput) => Promise<string | null>;

const integrationValidators: Partial<Record<IntegrationType, IntegrationValidator>> = {
  pushover: async (config) => {
    if (!('userKey' in config) || !config.userKey) return null;
    if (typeof config.userKey !== 'string') return 'invalid_pushover_key';
    const isValid = await validatePushoverUserKey(config.userKey);
    return isValid ? null : 'invalid_pushover_key';
  },
  discord: async (config) => {
    if (!('webhookUrl' in config) || !config.webhookUrl) return null;
    if (typeof config.webhookUrl !== 'string') return 'invalid_discord_webhook';
    const isValid = await validateDiscordWebhookUrl(config.webhookUrl);
    return isValid ? null : 'invalid_discord_webhook';
  },
  slack: async (config) => {
    if (!('webhookUrl' in config) || !config.webhookUrl) return null;
    if (typeof config.webhookUrl !== 'string') return 'invalid_slack_webhook';
    const isValid = await validateSlackWebhookUrl(config.webhookUrl);
    return isValid ? null : 'invalid_slack_webhook';
  },
  teams: async (config) => {
    if (!('webhookUrl' in config) || !config.webhookUrl) return null;
    if (typeof config.webhookUrl !== 'string') return 'invalid_teams_webhook';
    const isValid = await validateTeamsWebhookUrl(config.webhookUrl);
    return isValid ? null : 'invalid_teams_webhook';
  },
  webhook: async (config) => {
    if (!('webhookUrl' in config) || !config.webhookUrl) return null;
    if (typeof config.webhookUrl !== 'string') return 'invalid_webhook_url';
    const isValid = await validateWebhookUrl(config.webhookUrl);
    return isValid ? null : 'invalid_webhook_url';
  },
};

export async function validateIntegrationConfig(
  type: IntegrationType,
  config: IntegrationConfigInput,
): Promise<string | null> {
  const validator = integrationValidators[type];
  if (!validator) return null;
  return validator(config);
}

export async function getIntegrations(dashboardId: string): Promise<Integration[]> {
  try {
    const integrations = await IntegrationRepository.findIntegrationsByDashboardId(dashboardId);
    return integrations.map(decryptIntegration).map(maskIntegration);
  } catch (error) {
    console.error('Error getting integrations:', error);
    throw new Error('Failed to get integrations');
  }
}

export async function getIntegration(dashboardId: string, type: IntegrationType): Promise<Integration | null> {
  try {
    const integration = await IntegrationRepository.findIntegrationByType(dashboardId, type);
    if (!integration) return null;
    return maskIntegration(decryptIntegration(integration));
  } catch (error) {
    console.error('Error getting integration:', error);
    throw new Error('Failed to get integration');
  }
}

export async function saveIntegration(
  dashboardId: string,
  type: IntegrationType,
  input: IntegrationConfigInput,
  name?: string | null,
): Promise<Integration> {
  try {
    const existing = await IntegrationRepository.findIntegrationByType(dashboardId, type);

    let config: IntegrationConfig;
    if (existing) {
      const existingConfig = decryptConfig(existing.config as { encrypted: string });
      config = { ...existingConfig, ...input } as IntegrationConfig;
    } else {
      config = input as IntegrationConfig;
    }

    const configSchema = IntegrationConfigSchemas[type];
    configSchema.parse(config);

    const encryptedConfig = encryptConfig(config);

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
      sendSetupConfirmation(type, config).catch((err) => console.error('Failed to send setup confirmation:', err));
    }

    return maskIntegration(decryptIntegration(result));
  } catch (error) {
    console.error('Error saving integration:', error);
    throw new Error('Failed to save integration');
  }
}

export async function deleteIntegration(dashboardId: string, type: IntegrationType): Promise<void> {
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
    return maskIntegration(decryptIntegration(result));
  } catch (error) {
    console.error('Error toggling integration:', error);
    throw new Error('Failed to toggle integration');
  }
}

export async function validateDiscordWebhookUrl(webhookUrl: string): Promise<boolean> {
  if (!/^https:\/\/discord\.com\/api\/webhooks\//.test(webhookUrl)) return false;

  try {
    const response = await fetch(webhookUrl, { method: 'GET' });
    return response.ok;
  } catch (error) {
    console.error('Error validating Discord webhook URL:', error);
    return false;
  }
}

export async function validateSlackWebhookUrl(webhookUrl: string): Promise<boolean> {
  return /^https:\/\/hooks\.slack\.com\/services\//.test(webhookUrl);
}

export async function validateTeamsWebhookUrl(webhookUrl: string): Promise<boolean> {
  return /^https:\/\/(.*\.webhook\.office\.com\/|.*\.logic\.azure\.com(:443)?\/)/i.test(webhookUrl);
}

export async function validateWebhookUrl(webhookUrl: string): Promise<boolean> {
  return /^https:\/\//.test(webhookUrl);
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

type SetupConfirmationSender = (config: IntegrationConfig) => Promise<void>;

const setupConfirmationSenders: Partial<Record<IntegrationType, SetupConfirmationSender>> = {
  discord: async (config) => {
    if (!('webhookUrl' in config)) return;
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: 'Betterlytics Connected',
            description: 'This channel will now receive notifications from your Betterlytics dashboard.',
            color: 0x22c55e,
          },
        ],
      }),
    });
  },
  pushover: async (config) => {
    if (!('userKey' in config) || !env.PUSHOVER_APP_TOKEN) return;
    await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: env.PUSHOVER_APP_TOKEN,
        user: config.userKey,
        title: 'Betterlytics Connected',
        message: 'This device will now receive notifications from your Betterlytics dashboard.',
        priority: '0',
      }),
    });
  },
  slack: async (config) => {
    if (!('webhookUrl' in config)) return;
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '*Betterlytics Connected*\nThis channel will now receive notifications from your Betterlytics dashboard.',
      }),
    });
  },
  teams: async (config) => {
    if (!('webhookUrl' in config)) return;
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              version: '1.2',
              body: [
                {
                  type: 'TextBlock',
                  text: 'Betterlytics Connected',
                  weight: 'Bolder',
                  size: 'Medium',
                },
                {
                  type: 'TextBlock',
                  text: 'This channel will now receive notifications from your Betterlytics dashboard.',
                  wrap: true,
                },
              ],
            },
          },
        ],
      }),
    });
  },
  webhook: async (config) => {
    if (!('webhookUrl' in config)) return;
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Betterlytics Connected',
        message: 'This webhook will now receive notifications from your Betterlytics dashboard.',
      }),
    });
  },
};

async function sendSetupConfirmation(type: IntegrationType, config: IntegrationConfig): Promise<void> {
  const sender = setupConfirmationSenders[type];
  if (sender) await sender(config);
}
