import { z } from 'zod';
import { AdminAuditStatus } from '@prisma/client';

export const AdminAuditLogEntrySchema = z.object({
  id: z.string(),
  actorUserId: z.string(),
  actorLabel: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  targetLabel: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  status: z.nativeEnum(AdminAuditStatus),
  createdAt: z.date(),
});

export type AdminAuditLogEntry = z.infer<typeof AdminAuditLogEntrySchema>;

export type AdminAuditRecord = {
  actorUserId: string;
  actorLabel: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  payload: Record<string, unknown>;
  status: AdminAuditStatus;
};
