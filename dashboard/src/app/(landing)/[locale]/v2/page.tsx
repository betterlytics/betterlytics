import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { COPY } from '@/landing/content/copy';
import { LandingPage } from '@/landing/landingPage';

/** Daily, so the cached footer year and plans stay current. */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: COPY.seo.title,
  description: COPY.seo.description,
  robots: { index: false, follow: false },
};

export default async function LandingV2Page({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isClientFeatureEnabled('isCloud')) {
    notFound();
  }
  return <LandingPage />;
}
