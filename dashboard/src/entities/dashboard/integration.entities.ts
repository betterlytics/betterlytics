import { z } from 'zod';

export const INTEGRATION_TYPES = ['pushover', 'slack', 'discord', 'telegram', 'webhook', 'msteams'] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

const pushoverTokenRegex = /^[A-Za-z0-9]{30}$/;

export const PushoverConfigSchema = z.object({
  userKey: z.string().regex(pushoverTokenRegex),
});

export const SlackConfigSchema = z.object({
  webhookUrl: z.string().url(),
});

export const DiscordConfigSchema = z.object({
  webhookUrl: z.string().url(),
});

export const TelegramConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
});

export const WebhookConfigSchema = z.object({
  url: z.string().url(),
});

export const MSTeamsConfigSchema = z.object({
  webhookUrl: z.string().url(),
});

export const IntegrationConfigSchemas = {
  pushover: PushoverConfigSchema,
  slack: SlackConfigSchema,
  discord: DiscordConfigSchema,
  telegram: TelegramConfigSchema,
  webhook: WebhookConfigSchema,
  msteams: MSTeamsConfigSchema,
} as const;

export const IntegrationSchema = z
  .object({
    id: z.string(),
    dashboardId: z.string(),
    type: z.enum(INTEGRATION_TYPES),
    name: z.string().nullable(),
    enabled: z.boolean(),
    config: z.record(z.unknown()),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const IntegrationCreateSchema = z
  .object({
    dashboardId: z.string(),
    type: z.enum(INTEGRATION_TYPES),
    name: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    config: z.record(z.unknown()),
  })
  .strict();

export const IntegrationUpdateSchema = z.object({
  name: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export type Integration = z.infer<typeof IntegrationSchema>;
export type IntegrationCreate = z.infer<typeof IntegrationCreateSchema>;
export type IntegrationUpdate = z.infer<typeof IntegrationUpdateSchema>;
export type PushoverConfig = z.infer<typeof PushoverConfigSchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;
export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type MSTeamsConfig = z.infer<typeof MSTeamsConfigSchema>;
