'use client';

import { PricingComponent } from '@/components/pricing/PricingComponent';
import { useTranslations } from 'next-intl';

export function PricingSection() {
  const t = useTranslations('public.landing.pricing');
  return (
    <section id='pricing' className='bg-card/20 scroll-mt-20 py-20'>
      <div className='container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
          </h2>
          <p className='text-muted-foreground text-xl'>{t('subtitle')}</p>
        </div>

        <PricingComponent />

        <div className='mt-6 text-center'>
          <p className='text-muted-foreground text-sm'>{t('footer')}</p>
        </div>
      </div>
    </section>
  );
}
