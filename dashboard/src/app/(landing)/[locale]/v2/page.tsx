import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { COPY } from '@/landing/content/copy';
import { LandingPage } from '@/landing/landingPage';

/** Re-rendered daily in the background, so the cached page never runs far behind (the footer's year, the plans). */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: COPY.seo.title,
  description: COPY.seo.description,
  robots: { index: false, follow: false },
};

/**
 * Preview route for the landing redesign. Replaces the current landing page once
 * it's done; until then it is served only on the cloud build and kept out of
 * search indexes.
 */
export default async function LandingV2Page({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isClientFeatureEnabled('isCloud')) {
    notFound();
  }
  return <LandingPage />;
}
