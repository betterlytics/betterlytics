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

/**
 * No locale is rendered at build time, since builds run against placeholder env.
 * Each locale renders on its first request, with the real env, and is then
 * served from the cache like a static page.
 */
export function generateStaticParams() {
  return [];
}

/**
 * The landing page's own root layout. It reads nothing from the request (the
 * locale comes from the URL, the session is fetched by the client), which is what
 * lets the page be rendered once and cached.
 */
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
    // the copy is English under every locale until it moves into the message catalogue
    <html lang={COPY_LOCALE} className={`${sans.variable} ${mono.variable}`}>
      <head>
        <AppTrackingScript globalProperties={{ surface: 'app', locale }} />
        <StructuredData config={seoConfig} />
      </head>
      <body>
        {/* only the pricing panel's plan features are translated so far */}
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
