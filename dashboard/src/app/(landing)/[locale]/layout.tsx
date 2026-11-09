import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { BASE_METADATA } from '@/app/baseMetadata';
import { routing } from '@/i18n/routing';
import { LANDING_VIEWPORT, LandingDocument } from './components/page/landingDocument';

export const metadata: Metadata = BASE_METADATA;

export const viewport: Viewport = LANDING_VIEWPORT;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LandingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return <LandingDocument locale={locale}>{children}</LandingDocument>;
}
