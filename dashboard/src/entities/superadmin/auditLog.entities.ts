import { z } from 'zod';

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  actorUserId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
