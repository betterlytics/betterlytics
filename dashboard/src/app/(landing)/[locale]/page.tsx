import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { COPY } from '@/landing/content/copy';
import { LandingPage } from '@/landing/landingPage';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

/** Daily, so the cached footer year and plans stay current. */
export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return generateSEO({ ...(await buildSEOConfig(SEO_CONFIGS.root)), ...COPY.seo }, { locale });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isClientFeatureEnabled('isCloud')) {
    // no session check here, or the page turns dynamic; signed-out visitors go on to /signin from requireAuth
    redirect('/dashboards');
  }
  return (
    <>
      <StructuredData config={await buildSEOConfig(SEO_CONFIGS.organization)} />
      <LandingPage />
    </>
  );
}
