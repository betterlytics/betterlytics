import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BASE_METADATA } from '@/app/baseMetadata';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { LANDING_VIEWPORT, LandingDocument } from '@/landing/components/page/landingDocument';
import { BLOG_LOCALE } from './_lib/blog';

export const metadata: Metadata = BASE_METADATA;

export const viewport: Viewport = LANDING_VIEWPORT;

/** Daily, like the landing pages, so the cached footer year stays current. */
export const revalidate = 86400;

/** Outside [locale], so the locale is pinned rather than read from the URL or the visitor's cookie. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  setRequestLocale(BLOG_LOCALE);
  return <LandingDocument locale={BLOG_LOCALE}>{children}</LandingDocument>;
}
