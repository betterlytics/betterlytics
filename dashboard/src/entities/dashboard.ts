import { z } from 'zod';
import { DashboardRole } from '@prisma/client';

// Domain validation schema (example.com)
export const domainValidation = z
  .string()
  .min(1, 'Domain is required')
  .transform((domain) => {
    // Clean the domain: remove protocol and www
    return domain
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^http?:\/\//, '')
      .replace(/^www\./, '');
  })
  .refine((domain) => domain.includes('.'), { message: 'Domain must include an extension (e.g., example.com)' })
  .refine(
    (domain) => {
      const domainRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/;
      return domainRegex.test(domain);
    },
    { message: 'Please enter a valid domain format' },
  );

export const DashboardSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  domain: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const DashboardWriteSchema = z.object({
  siteId: z.string(),
  domain: domainValidation,
  userId: z.string(),
});

export const DashboardFindByUserSchema = z.object({
  userId: z.string(),
  dashboardId: z.string(),
});

export const DashboardUserSchema = z.object({
  userId: z.string(),
  dashboardId: z.string(),
  id: z.string(),
  role: z.nativeEnum(DashboardRole),
  isDefault: z.boolean(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;
export type DashboardWriteData = z.infer<typeof DashboardWriteSchema>;
export type DashboardFindByUserData = z.infer<typeof DashboardFindByUserSchema>;
export type DashboardUser = z.infer<typeof DashboardUserSchema>;
