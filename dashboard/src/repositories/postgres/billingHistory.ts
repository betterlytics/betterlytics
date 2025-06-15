import prisma from '@/lib/postgres';
import { BillingHistory, BillingHistorySchema } from '@/entities/billing';

export async function getBillingHistoryByUserId(userId: string): Promise<BillingHistory[]> {
  try {
    const billingHistory = await prisma.billingHistory.findMany({
      where: { userId },
      orderBy: { periodStart: 'desc' },
    });

    return billingHistory.map((history) => BillingHistorySchema.parse(history));
  } catch (error) {
    console.error('Failed to get user billing history:', error);
    return [];
  }
}

export async function createBillingHistoryEntry(data: {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  eventCount: number;
  eventLimit: number;
  amountPaid: number;
  paymentInvoiceId?: string;
  paymentPaymentIntentId?: string;
  status: string;
}): Promise<BillingHistory> {
  const billingHistory = await prisma.billingHistory.create({
    data,
  });

  return BillingHistorySchema.parse(billingHistory);
}
