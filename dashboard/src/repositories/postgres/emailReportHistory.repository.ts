import prisma from '@/lib/postgres';
import {
  EmailReportHistoryCreate,
  EmailReportHistoryCreateSchema,
} from '@/entities/reports/emailReportHistory.entities';

export async function createReportHistoryEntry(data: EmailReportHistoryCreate) {
  const validated = EmailReportHistoryCreateSchema.parse(data);

  await prisma.emailReportHistory.create({
    data: validated,
  });
}
