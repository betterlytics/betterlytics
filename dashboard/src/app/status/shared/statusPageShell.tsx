import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import type { PublicStatusPageData } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { statusPagePublicUrl } from '@/entities/analytics/statusPage/statusPage.helpers';
import { statusDotFavicon } from '@/entities/analytics/statusPage/publicStatusPage.helpers';
import { StatusPageView } from '@/app/status/[slug]/components/StatusPageView';

/**
 * Metadata shared by every public status page route (slug and custom-domain).
 * `statusPagePublicUrl` prefers the custom domain when set, so the canonical consolidates the
 * `/status/{slug}` duplicate onto the custom domain automatically.
 */
export async function buildStatusPageMetadata(data: PublicStatusPageData): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'publicStatusPage' });
  // A stable tagline rather than the live status text, so the meta/social description doesn't churn
  // (and get cached mid-incident) every time the overall status changes.
  const description = t('meta.description', { name: data.name });

  const iconUrl = data.faviconUrl ?? statusDotFavicon(data.overallStatus);

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

/** Renders a resolved public status page. Status pages always render in English, independent of visitor locale. */
export async function StatusPageShell({ data }: { data: PublicStatusPageData }) {
  const messages = await getMessages({ locale: 'en' });

  return (
    <NextIntlClientProvider locale='en' messages={{ publicStatusPage: messages.publicStatusPage }}>
      <StatusPageView data={data} />
    </NextIntlClientProvider>
  );
}
