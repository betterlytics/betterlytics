import { z } from 'zod';

export const INTEGRATION_TYPES = ['pushover', 'discord'] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

const pushoverTokenRegex = /^[A-Za-z0-9]{30}$/;

export const PUSHOVER_PRIORITIES = [-2, -1, 0, 1] as const;
export type PushoverPriority = (typeof PUSHOVER_PRIORITIES)[number];

export const PushoverConfigSchema = z.object({
  userKey: z.string().regex(pushoverTokenRegex),
  priority: z.number().int().min(-2).max(1).default(0),
});

export const DiscordConfigSchema = z.object({
  webhookUrl: z.string().url(),
});

export const IntegrationConfigSchemas = {
  pushover: PushoverConfigSchema,
  discord: DiscordConfigSchema
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
export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;
