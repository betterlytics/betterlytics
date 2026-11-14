import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { AppShell } from '@/app/AppShell';
import { BASE_METADATA } from '@/app/baseMetadata';
import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import ThemeToggleFab from '@/components/ThemeToggleFab';
import { routing } from '@/i18n/routing';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = {
  ...BASE_METADATA,
  title: 'Betterlytics',
};

export const revalidate = 86400;

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}

/** A root layout of its own: the app's reads the session and the visitor's locale, so nothing under it can be cached. */
export default async function PublicLayout({
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
  const isCloud = isFeatureEnabled('isCloud');

  return (
    <AppShell lang={locale} cacheable>
      <div className='flex min-h-screen flex-col justify-between'>
        <PublicTopBar isCloud={isCloud} registrationEnabled={isFeatureEnabled('enableRegistration')} />
        <div className='flex flex-1 flex-col'>{children}</div>
        <Footer />
        <ThemeToggleFab />
      </div>
    </AppShell>
  );
}
