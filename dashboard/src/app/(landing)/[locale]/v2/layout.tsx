import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Schibsted_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { BASE_METADATA } from '@/app/baseMetadata';
import { StructuredData } from '@/components/StructuredData';
import { AppTrackingScript } from '@/components/tracking/AppTrackingScript';
import { GlobalPropertiesUpdater } from '@/components/tracking/GlobalPropertiesUpdater';
import { routing } from '@/i18n/routing';
import { COPY_LOCALE } from '@/landing/content/copy';
import { env } from '@/lib/env';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { LandingProviders } from './providers';
import './landing.css';

const sans = Schibsted_Grotesk({
  variable: '--font-landing-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const mono = IBM_Plex_Mono({
  variable: '--font-landing-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = BASE_METADATA;

export const viewport: Viewport = {
  themeColor: '#151414',
  colorScheme: 'dark',
};

/** None at build time (placeholder env); each locale renders on first request, then serves from cache. */
export function generateStaticParams() {
  return [];
}

/** Must read nothing from the request (the client fetches the session) so the page can be cached. */
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

  const [messages, seoConfig] = await Promise.all([getMessages(), buildSEOConfig(SEO_CONFIGS.root)]);

  return (
    <html lang={COPY_LOCALE} className={`${sans.variable} ${mono.variable}`}>
      <head>
        <AppTrackingScript globalProperties={{ surface: 'app', locale }} />
        <StructuredData config={seoConfig} />
      </head>
      <body>
        {/* only the plan features are translated so far */}
        <NextIntlClientProvider messages={{ pricingCards: messages.pricingCards }}>
          <LandingProviders>
            {env.ENABLE_APP_TRACKING && <GlobalPropertiesUpdater />}
            {children}
          </LandingProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
