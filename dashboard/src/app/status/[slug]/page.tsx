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

  const t = await getTranslations({ locale: data.language, namespace: 'publicStatusPage' });
  const description = t(`banner.${data.overallStatus}`);

  return {
    title: data.name,
    description,
    alternates: { canonical: `${env.PUBLIC_BASE_URL}/status/${data.slug}` },
    openGraph: { title: data.name, description },
  };
}

export default async function PublicStatusPage({ params }: StatusPageParams) {
  const { slug } = await params;
  const data = await resolveStatusPage(slug);
  if (!data) {
    notFound();
  }

  // Scope translations to the OWNER's chosen page language (not the visitor's)
  const messages = await getMessages({ locale: data.language });

  return (
    <NextIntlClientProvider locale={data.language} messages={{ publicStatusPage: messages.publicStatusPage }}>
      <StatusPageView data={data} />
    </NextIntlClientProvider>
  );
}
