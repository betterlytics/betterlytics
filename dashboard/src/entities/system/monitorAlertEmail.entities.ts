import { z } from 'zod';

const MonitorAlertBaseSchema = z.object({
  to: z.string().trim().email(),
  toName: z.string().optional(),
  from: z.string().optional(),
  fromName: z.string().optional(),
  monitorName: z.string(),
  url: z.string().min(1),
  dashboardId: z.string().min(1),
  monitorId: z.string().min(1),
});

export const MonitorDownEmailDataSchema = MonitorAlertBaseSchema.extend({
  reason: z.string(),
  statusCode: z.number().int().nonnegative().optional(),
  detectedAt: z.string().datetime({ offset: true }),
});

export const MonitorRecoveryEmailDataSchema = MonitorAlertBaseSchema.extend({
  recoveredAt: z.string().datetime({ offset: true }),
  downtimeSeconds: z.number().int().nonnegative().optional(),
});

export const MonitorSslEmailDataSchema = MonitorAlertBaseSchema.extend({
  expired: z.boolean(),
  daysLeft: z.number().int(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export type MonitorDownEmailData = z.infer<typeof MonitorDownEmailDataSchema>;
export type MonitorRecoveryEmailData = z.infer<typeof MonitorRecoveryEmailDataSchema>;
export type MonitorSslEmailData = z.infer<typeof MonitorSslEmailDataSchema>;
