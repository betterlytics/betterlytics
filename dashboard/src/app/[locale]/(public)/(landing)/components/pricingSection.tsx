'use client';

import { PricingComponent } from '@/components/pricing/PricingComponent';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';

export function PricingSection() {
  const t = useTranslations('public.landing.pricing');
  return (
    <section id='pricing' className='scroll-mt-20 overflow-visible py-20'>
      <div className='container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
          </h2>
          <p className='text-muted-foreground text-xl'>{t('subtitle')}</p>
        </div>

        <PricingComponent />

        <div className='mt-4 ml-2 flex justify-center text-center sm:mt-10 sm:gap-2'>
          <CheckCircle className='text-muted-foreground h-5 w-4' />
          <p className='text-muted-foreground max-w-2xl text-sm'>{t('footer')}</p>
        </div>
      </div>
    </section>
  );
}
