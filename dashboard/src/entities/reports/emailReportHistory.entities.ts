import { z } from 'zod';

export const EmailReportStatusSchema = z.enum(['sent', 'failed']);
export const EmailReportTypeSchema = z.enum(['weekly', 'monthly']);

export const EmailReportHistoryCreateSchema = z.object({
  dashboardId: z.string(),
  reportType: EmailReportTypeSchema,
  recipient: z.string().email(),
  status: EmailReportStatusSchema,
  periodStart: z.date(),
  periodEnd: z.date(),
  errorMessage: z.string().nullable().optional(),
});

export type EmailReportStatus = z.infer<typeof EmailReportStatusSchema>;
export type EmailReportType = z.infer<typeof EmailReportTypeSchema>;
export type EmailReportHistoryCreate = z.infer<typeof EmailReportHistoryCreateSchema>;
