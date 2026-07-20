'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { formatPrice } from '@/utils/pricing';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';

interface CreditBalanceCalloutProps {
  className?: string;
  variant?: 'panel' | 'plain';
}

export function CreditBalanceCallout({ className, variant = 'panel' }: CreditBalanceCalloutProps) {
  const t = useTranslations('components.billing.creditBalance');
  const locale = useLocale();
  const { creditBalance, currency } = useCreditBalance();

  if (creditBalance <= 0) {
    return null;
  }

  const amount = formatPrice(creditBalance, currency, locale as SupportedLanguages);

  if (variant === 'plain') {
    return (
      <div className={className}>
        <div className='text-muted-foreground text-sm'>{t('label')}</div>
        <div className='font-semibold text-emerald-600 dark:text-emerald-400'>{amount}</div>
      </div>
    );
  }

  return (
    <div className={cn('bg-muted/40 flex items-center justify-between gap-4 rounded-lg px-4 py-3', className)}>
      <div className='min-w-0'>
        <div className='text-sm font-medium'>{t('label')}</div>
        <div className='text-muted-foreground text-xs'>{t('hint')}</div>
      </div>
      <div className='shrink-0 text-base font-semibold text-emerald-600 tabular-nums dark:text-emerald-400'>
        {amount}
      </div>
    </div>
  );
}
