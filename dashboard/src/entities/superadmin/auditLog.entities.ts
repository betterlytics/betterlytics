import { z } from 'zod';
import { SuperAdminAuditStatus } from '@prisma/client';

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  actorUserId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  status: z.nativeEnum(SuperAdminAuditStatus),
  createdAt: z.date(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
