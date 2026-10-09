import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { UserSchema } from '@/entities/auth/user.entities';

export const SuperAdminUserListEntrySchema = z.object({
  id: z.string(),
  email: UserSchema.shape.email,
  name: z.string().nullable(),
  role: z.nativeEnum(UserRole).nullable(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type SuperAdminUserListEntry = z.infer<typeof SuperAdminUserListEntrySchema>;
