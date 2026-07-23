import { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

import { StructuredData } from '@/components/StructuredData';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { FeaturesHero } from './components/FeaturesHero';
import { FeatureCategories } from './components/FeatureCategories';
import { CtaStrip } from '@/components/public/ctaStrip';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.features);
  return generateSEO(seoConfig, { locale });
}

export default async function FeaturesPage() {
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.features);

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='relative'>
        <div
          className='pointer-events-none absolute inset-x-0 -top-20 h-[500px] bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_60%)]'
          aria-hidden
        />

        <FeaturesHero />
        <FeatureCategories />
        <div className='mb-16'>
          <CtaStrip />
        </div>
      </div>
    </>
  );
}
