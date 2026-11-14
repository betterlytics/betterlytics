import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { StructuredData } from '@/components/StructuredData';
import { getBillingFaq } from '@/components/billing/billingFaq';
import type { SupportedLanguages } from '@/constants/i18n';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { PricingPage } from './pricingPage';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return generateSEO(await buildSEOConfig(SEO_CONFIGS.pricing), { locale });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isClientFeatureEnabled('enableBilling')) {
    notFound();
  }
  const [seoConfig, faq] = await Promise.all([buildSEOConfig(SEO_CONFIGS.pricing), getBillingFaq()]);
  return (
    <>
      <StructuredData config={seoConfig} />
      <PricingPage faq={faq.items} />
    </>
  );
}
