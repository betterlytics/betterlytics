import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const SuperAdminUserListEntrySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.nativeEnum(UserRole).nullable(),
  totpEnabled: z.boolean(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type SuperAdminUserListEntry = z.infer<typeof SuperAdminUserListEntrySchema>;
