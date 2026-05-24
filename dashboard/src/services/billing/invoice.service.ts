'server-only';

import { stripe } from '@/lib/billing/stripe';
import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { UserInvoiceSchema, type UserInvoice } from '@/entities/billing/billing.entities';
import { UserException } from '@/lib/exceptions';

const INVOICE_LIST_LIMIT = 12;

export async function listUserInvoices(userId: string): Promise<UserInvoice[]> {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription?.paymentCustomerId) {
      return [];
    }

    const invoices = await stripe.invoices.list({
      customer: subscription.paymentCustomerId,
      limit: INVOICE_LIST_LIMIT,
    });

    return invoices.data.flatMap<UserInvoice>((invoice) => {
      if (!invoice.id) return [];
      try {
        return [
          UserInvoiceSchema.parse({
            id: invoice.id,
            number: invoice.number,
            created: new Date(invoice.created * 1000),
            total: invoice.total,
            currency: invoice.currency.toUpperCase(),
            status: invoice.status,
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
            invoicePdf: invoice.invoice_pdf ?? null,
          }),
        ];
      } catch (parseError) {
        console.error(`Failed to parse invoice ${invoice.id}, skipping:`, parseError);
        return [];
      }
    });
  } catch (error) {
    console.error('Failed to list user invoices:', error);
    throw new UserException('Failed to load invoices');
  }
}
