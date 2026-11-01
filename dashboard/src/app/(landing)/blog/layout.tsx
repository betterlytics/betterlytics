import type { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { BASE_METADATA } from '@/app/baseMetadata';
import { LANDING_VIEWPORT, LandingDocument } from '@/landing/components/page/landingDocument';
import { BLOG_LOCALE } from './_lib/blog';

export const metadata: Metadata = BASE_METADATA;

export const viewport: Viewport = LANDING_VIEWPORT;

/** Outside [locale], so the locale is pinned rather than read from the URL or the visitor's cookie. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale(BLOG_LOCALE);
  return <LandingDocument locale={BLOG_LOCALE}>{children}</LandingDocument>;
}
