'use client';

import { useLocale, useTranslations } from 'next-intl';
import { activeDiscount, applyPercentOff } from '@/lib/billing/discount';
import type { UserBillingData } from '@/entities/billing/billing.entities';

export function useSubscriptionDiscount(subscription: UserBillingData['subscription'] | undefined) {
  const t = useTranslations('components.billing.discount');
  const locale = useLocale();
  const discount = subscription ? activeDiscount(subscription) : null;

  if (!subscription || !discount) {
    return { monthlyPrice: subscription?.pricePerMonth ?? 0, discountLabel: null };
  }

  const percent = discount.percentOff;
  return {
    monthlyPrice: applyPercentOff(subscription.pricePerMonth, percent),
    discountLabel: discount.endsAt
      ? t('until', {
          percent,
          date: discount.endsAt.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
        })
      : t('forever', { percent }),
  };
}
