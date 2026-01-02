import { notFound } from 'next/navigation';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { CoreFeaturesSection } from '@/components/pricing/CoreFeaturesSection';
import { BillingFAQGrid } from '@/app/(protected)/billing/BillingFAQGrid';
import { getTranslations } from 'next-intl/server';
import { CheckCircle } from 'lucide-react';

export async function generateMetadata() {
  return buildSEOConfig(SEO_CONFIGS.pricing);
}

export default async function PricingPage() {
  if (!isClientFeatureEnabled('enableBilling')) {
    return notFound();
  }

  const t = await getTranslations('public.pricing');

  return (
    <>
      <StructuredData config={await buildSEOConfig(SEO_CONFIGS.pricing)} />
      <div className='bg-background text-foreground'>
        <section className='scroll-mt-20 overflow-visible py-20'>
          <div className='container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <div className='mb-16 text-center'>
              <h1 className='mb-4 text-3xl font-bold sm:text-4xl'>
                <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
              </h1>
              <p className='text-muted-foreground text-xl'>{t('subtitle')}</p>
            </div>

            <PricingComponent />

            <div className='mt-4 ml-2 flex justify-center text-center sm:mt-10 sm:gap-2'>
              <CheckCircle className='text-muted-foreground h-5 w-4' />
              <p className='text-muted-foreground max-w-2xl text-sm'>{t('footer')}</p>
            </div>

            <div id='comparison' className='mt-20 scroll-mt-20'>
              <h2 className='mb-10 text-center text-2xl font-bold sm:text-3xl'>{t('comparisonTitle')}</h2>
              <FeatureComparisonTable />
            </div>

            <div className='mt-16'>
              <CoreFeaturesSection />
            </div>
          </div>
        </section>

        <section className='py-16'>
          <BillingFAQGrid />
        </section>
      </div>
    </>
  );
}
