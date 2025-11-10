import { z } from "zod";
import { DashboardRole } from '@prisma/client';

export const AuthContextSchema = z.object({
  dashboardId: z.string(),
  userId: z.string(),
  siteId: z.string(),
  role: z.nativeEnum(DashboardRole)
});
export type AuthContext = z.infer<typeof AuthContextSchema>;
