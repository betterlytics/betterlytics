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
    <div className='border-b border-rule bg-fg/6 text-label tracking-ui text-fg/85'>
      <p className='mx-auto max-w-[1480px] px-(--pad) py-2 text-center text-balance'>
        <span className='mr-2.5 inline-block rounded-[4px] bg-volt-lift px-2 align-[1px] text-[12.5px] leading-5 font-medium text-on-volt'>
          {t('barTag')}
        </span>
        {t('bar', { percent: promo.percentOff, months: promo.months, date: lastDay })}{' '}
        <AppLink
          className='ml-1.5 font-medium whitespace-nowrap text-volt-soft underline decoration-volt-soft/45 underline-offset-3 transition-[text-decoration-color] duration-200 hover:decoration-volt-soft'
          href='/pricing'
          onClick={() => track.promoBar(promo.id)}
        >
          {t('barCta')} →
        </AppLink>
      </p>
    </div>
  );
}
