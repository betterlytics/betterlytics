import { z } from 'zod';

export const AuthContextSchema = z.object({
  dashboardId: z.string(),
  userId: z.string(),
  siteId: z.string(),
  role: z.string(),
  isDemo: z.boolean(),
});
export type AuthContext = z.infer<typeof AuthContextSchema>;
