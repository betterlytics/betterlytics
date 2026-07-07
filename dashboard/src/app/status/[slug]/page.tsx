import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { PublicOverallStatus } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { getPublicStatusPageData } from '@/services/analytics/publicStatusPage.service';
import { statusPagePublicUrl } from '@/entities/analytics/statusPage/statusPage.helpers';
import { StatusPageView } from './components/StatusPageView';

export const revalidate = 60;

type StatusPageParams = { params: Promise<{ slug: string }> };

const FAVICON_DOT_COLOR: Record<PublicOverallStatus, string> = {
  operational: '#10b981',
  degraded: '#d97706',
  partial_outage: '#ea580c',
  outage: '#dc2626',
  unknown: '#9ca3af',
};

function statusDotFavicon(status: PublicOverallStatus): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${FAVICON_DOT_COLOR[status]}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
    // `manifest: null` for the same reason as the main return below.
    return { manifest: null };
  }

  const t = await getTranslations({ locale: 'en', namespace: 'publicStatusPage' });
  // A stable tagline rather than the live status text, so the meta/social description doesn't churn
  // (and get cached mid-incident) every time the overall status changes.
  const description = t('meta.description', { name: data.name });

  // Prefer the uploaded favicon, then the status-dot fallback.
  const iconUrl = data.faviconUrl ?? statusDotFavicon(data.overallStatus);

  // The custom domain when set, otherwise the /status/{slug} URL. Used for both the canonical and the
  // social embed URL so shared links resolve to the owner's own domain.
  const publicUrl = statusPagePublicUrl(data, env.PUBLIC_BASE_URL);

  return {
    title: data.name,
    description,
    robots: data.noindex ? { index: false, follow: false } : undefined,
    // Prefer the custom domain as the canonical when set, so the /status/{slug} duplicate consolidates to it.
    alternates: { canonical: publicUrl },
    openGraph: {
      type: 'website',
      url: publicUrl,
      siteName: data.name,
      title: data.name,
      description,
    },
    // No image, so the compact card. X/Twitter reads these rather than the OG tags.
    twitter: { card: 'summary', title: data.name, description },
    // `sizes: 'any'` makes browsers prefer this over the app-wide /favicon.ico.
    icons: { icon: [{ url: iconUrl, sizes: 'any' }] },
    // Opt out of the app-wide web manifest
    manifest: null,
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
