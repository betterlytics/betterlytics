'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { usePromo, usePromoLastDay } from '@/components/pricing/usePromo';
import { baEvent } from '@/lib/ba-event';

// the sales pages in this layout; legal pages, contact and the demo stay free of the promo
const PROMO_PAGES = /^\/(vs|features)(\/|$)/;

export default function PublicPromoBar() {
  const t = useTranslations('promo');
  const pathname = usePathname();
  const promo = usePromo();
  const lastDay = usePromoLastDay(promo);
  if (!promo || !PROMO_PAGES.test(pathname)) return null;

  return (
    <div className='bg-muted/60 text-foreground/85 border-b text-sm'>
      <p className='mx-auto max-w-7xl px-8 py-2 text-center text-balance'>
        <span className='bg-primary text-primary-foreground mr-2.5 inline-block rounded px-2 align-[1px] text-xs leading-5 font-medium'>
          {t('barTag')}
        </span>
        {t('bar', { percent: promo.percentOff, months: promo.months, date: lastDay })}{' '}
        <Link
          href='/pricing'
          className='text-primary decoration-primary/45 hover:decoration-primary ml-1.5 font-medium whitespace-nowrap underline underline-offset-3'
          onClick={() => baEvent('landing-promo-bar', { promo: promo.id })}
        >
          {t('barCta')} →
        </Link>
      </p>
    </div>
  );
}
