import { z } from 'zod';

export const NotificationHistoryRowSchema = z
  .object({
    ts: z.date(),
    integrationType: z.string(),
    title: z.string(),
    status: z.enum(['sent', 'failed']),
    errorMessage: z.string(),
    attemptCount: z.number().int(),
  })
  .strict();

export type NotificationHistoryRow = z.infer<typeof NotificationHistoryRowSchema>;
