'use client';

import { useTranslations } from 'next-intl';
import { usePromo, usePromoLastDay } from '@/components/pricing/usePromo';
import { AppLink } from '@/landing/components/ui/appLink';
import { track } from '@/landing/lib/analytics';

export function PromoBar() {
  const t = useTranslations('promo');
  const promo = usePromo();
  const lastDay = usePromoLastDay(promo);
  if (!promo) return null;

  return (
    <div className='bg-volt text-label tracking-ui text-on-volt'>
      <p className='mx-auto max-w-[1480px] px-(--pad) py-2 text-center text-balance'>
        {t('bar', { percent: promo.percentOff, months: promo.months, date: lastDay })}{' '}
        <AppLink
          className='ml-1.5 font-medium whitespace-nowrap underline decoration-on-volt/40 underline-offset-3 transition-[text-decoration-color] duration-200 hover:decoration-on-volt'
          href='/pricing'
          onClick={() => track.promoBar(promo.id)}
        >
          {t('barCta')} →
        </AppLink>
      </p>
    </div>
  );
}
