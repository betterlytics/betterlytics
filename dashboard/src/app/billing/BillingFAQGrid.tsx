import { getTranslations } from 'next-intl/server';

export async function BillingFAQGrid() {
  const t = await getTranslations('components.billing.faq');

  const items = [
    { q: t('items.changePlan.q'), a: t('items.changePlan.a') },
    { q: t('items.exceedLimit.q'), a: t('items.exceedLimit.a') },
    { q: t('items.annualBilling.q'), a: t('items.annualBilling.a') },
    { q: t('items.freeOption.q'), a: t('items.freeOption.a') },
    { q: t('items.cancelAnytime.q'), a: t('items.cancelAnytime.a') },
    { q: t('items.paymentMethods.q'), a: t('items.paymentMethods.a') },
  ];

  return (
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      <div className='mb-12 text-center'>
        <h3 className='mb-4 text-2xl font-bold'>{t('title')}</h3>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </div>

      <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {items.map((item) => (
          <div key={item.q} className='space-y-3'>
            <h4 className='text-base font-semibold'>{item.q}</h4>
            <p className='text-muted-foreground text-sm leading-relaxed'>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
