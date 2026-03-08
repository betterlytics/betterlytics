'use client';

import { PricingComponent } from '@/components/pricing/PricingComponent';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { ScrollGradientText } from '@/components/animations/ScrollGradientText';

export function PricingSection() {
  const t = useTranslations('public.landing.pricing');
  return (
    <section id='pricing' className='scroll-mt-20 overflow-visible py-24'>
      <div className='container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <ScrollReveal className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <ScrollGradientText>{t('titleEmphasis')}</ScrollGradientText> {t('titleRest')}
          </h2>
          <p className='text-muted-foreground text-xl'>{t('subtitle')}</p>
        </ScrollReveal>

        <ScrollReveal>
          <PricingComponent />
        </ScrollReveal>

        <ScrollReveal>
          <div className='mt-4 ml-2 flex justify-center text-center sm:mt-10 sm:gap-2'>
            <CheckCircle className='text-muted-foreground h-5 w-4' />
            <p className='text-muted-foreground max-w-2xl text-sm'>{t('footer')}</p>
          </div>

          <div className='mt-6 flex justify-center'>
            <Link
              href='/pricing#comparison'
              className='text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors'
            >
              {t('compareLink')}
              <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
