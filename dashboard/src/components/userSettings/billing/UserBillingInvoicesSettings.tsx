'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUserInvoices } from '@/hooks/useUserInvoices';
import type { UserInvoice } from '@/entities/billing/billing.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatPrice } from '@/utils/pricing';
import UserSettingsSection from '../shared/UserSettingsSection';

export default function UserBillingInvoicesSettings() {
  const t = useTranslations('components.userSettings.billing.invoices');
  const locale = useLocale();
  const { invoices, isLoading, error } = useUserInvoices();

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <UserSettingsSection title={t('title')}>
        <Skeleton className='h-20 w-full' />
      </UserSettingsSection>
    );
  }

  if (invoices.length === 0) {
    return null;
  }

  return (
    <UserSettingsSection title={t('title')}>
      <div className='-mx-2 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-muted-foreground border-border border-b text-left text-xs font-medium'>
              <th className='px-2 py-2 font-medium'>{t('columns.date')}</th>
              <th className='px-2 py-2 font-medium'>{t('columns.total')}</th>
              <th className='px-2 py-2 font-medium'>{t('columns.status')}</th>
              <th className='px-2 py-2 font-medium'>
                <span className='sr-only'>{t('columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} locale={locale} />
            ))}
          </tbody>
        </table>
      </div>
    </UserSettingsSection>
  );
}

interface InvoiceRowProps {
  invoice: UserInvoice;
  locale: string;
}

function InvoiceRow({ invoice, locale }: InvoiceRowProps) {
  const t = useTranslations('components.userSettings.billing.invoices');
  const date = invoice.created.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // A negative invoice total is credit added to the customer's balance
  const isCredit = invoice.total < 0;
  const total = formatPrice(invoice.total, invoice.currency, locale as SupportedLanguages);
  const viewUrl = invoice.hostedInvoiceUrl ?? invoice.invoicePdf;

  return (
    <tr className='border-border/60 border-b last:border-b-0'>
      <td className='px-2 py-3'>{date}</td>
      <td className={cn('px-2 py-3 tabular-nums', isCredit && 'text-emerald-600 dark:text-emerald-400')}>
        {total}
      </td>
      <td className='px-2 py-3'>
        <InvoiceStatusBadge status={invoice.status} isCredit={isCredit} />
      </td>
      <td className='px-2 py-3 text-right'>
        {viewUrl && (
          <a
            href={viewUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
          >
            {t('view')}
            <ExternalLinkIcon className='h-3 w-3' />
          </a>
        )}
      </td>
    </tr>
  );
}

const INVOICE_BADGE_STYLES: Record<
  NonNullable<UserInvoice['status']>,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  paid: {
    variant: 'default',
    className: 'border-transparent bg-emerald-600 text-white dark:bg-emerald-800',
  },
  open: { variant: 'default' },
  draft: { variant: 'secondary' },
  uncollectible: { variant: 'destructive' },
  void: { variant: 'destructive' },
};

function InvoiceStatusBadge({ status, isCredit }: { status: UserInvoice['status']; isCredit?: boolean }) {
  const t = useTranslations('components.userSettings.billing.invoices.status');

  if (isCredit) {
    return (
      <Badge variant={INVOICE_BADGE_STYLES.paid.variant} className={INVOICE_BADGE_STYLES.paid.className}>
        {t('credit')}
      </Badge>
    );
  }

  if (!status) {
    return null;
  }

  const { variant, className } = INVOICE_BADGE_STYLES[status];
  return (
    <Badge variant={variant} className={className}>
      {t(status)}
    </Badge>
  );
}
