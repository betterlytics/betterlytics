import { getTranslations } from 'next-intl/server';
import { freeSubscriptionDefaults } from '@/lib/billing/catalog';

export async function getBillingFaq() {
  const t = await getTranslations('components.billing.faq');
  return {
    title: t('title'),
    subtitle: t('subtitle'),
    items: [
      { q: t('items.changePlan.q'), a: t('items.changePlan.a') },
      { q: t('items.exceedLimit.q'), a: t('items.exceedLimit.a') },
      { q: t('items.annualBilling.q'), a: t('items.annualBilling.a') },
      {
        q: t('items.freeOption.q'),
        a: t('items.freeOption.a', { events: freeSubscriptionDefaults().eventLimit }),
      },
      { q: t('items.cancelAnytime.q'), a: t('items.cancelAnytime.a') },
      { q: t('items.paymentMethods.q'), a: t('items.paymentMethods.a') },
    ],
  };
}
