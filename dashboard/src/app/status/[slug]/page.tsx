import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getPublicStatusPageData } from '@/services/analytics/publicStatusPage.service';
import { StatusPageView } from './components/StatusPageView';

export const revalidate = 60;

type StatusPageParams = { params: Promise<{ slug: string }> };

const resolveStatusPage = cache(async (slug: string) => {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    return null;
  }
  return getPublicStatusPageData(slug);
});

export async function generateMetadata({ params }: StatusPageParams): Promise<Metadata> {
  const { slug } = await params;
  const data = await resolveStatusPage(slug);
  if (!data) {
    return {};
  }

  const t = await getTranslations({ locale: 'en', namespace: 'publicStatusPage' });
  const description = t(`banner.${data.overallStatus}`);

  // Prefer the uploaded favicon; fall back to the logo. Both URLs are cache-busted via ?v={hash}.
  const iconUrl = data.faviconUrl ?? data.logoUrl;

  return {
    title: data.name,
    description,
    robots: data.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `${env.PUBLIC_BASE_URL}/status/${data.slug}` },
    openGraph: { title: data.name, description },
    // `sizes: 'any'` makes browsers prefer this over the app-wide /favicon.ico.
    icons: iconUrl ? { icon: [{ url: iconUrl, sizes: 'any' }] } : undefined,
  };
}

export default async function PublicStatusPage({ params }: StatusPageParams) {
  const { slug } = await params;
  const data = await resolveStatusPage(slug);
  if (!data) {
    notFound();
  }

  // Status pages always render in English, independent of the visitor's locale.
  const messages = await getMessages({ locale: 'en' });

  return (
    <NextIntlClientProvider locale='en' messages={{ publicStatusPage: messages.publicStatusPage }}>
      <StatusPageView data={data} />
    </NextIntlClientProvider>
  );
}
