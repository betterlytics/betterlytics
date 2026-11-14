import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { IBM_Plex_Mono, Schibsted_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import NextTopLoader from 'nextjs-toploader';
import { StructuredData } from '@/components/StructuredData';
import { AppTrackingScript } from '@/components/tracking/AppTrackingScript';
import { GlobalPropertiesUpdater } from '@/components/tracking/GlobalPropertiesUpdater';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { landingClientMessages } from '@/landing/lib/clientMessages';
import { LandingProviders } from '@/landing/providers';
import '@/landing/landing.css';

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

export const LANDING_VIEWPORT: Viewport = {
  themeColor: '#151414',
  colorScheme: 'dark',
};

/** Must read nothing from the request (the client fetches the session) so the page can be cached. */
export async function LandingDocument({ locale, children }: { locale: string; children: ReactNode }) {
  const [messages, seoConfig] = await Promise.all([
    getMessages(),
    isFeatureEnabled('isCloud') ? buildSEOConfig(SEO_CONFIGS.root) : null,
  ]);
  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable}`}>
      <head>
        <AppTrackingScript globalProperties={{ surface: 'app', locale, theme: 'dark' }} />
        {seoConfig && <StructuredData config={seoConfig} />}
      </head>
      <body>
        <NextTopLoader color='var(--color-volt-lift)' height={3} showSpinner={false} shadow={false} />
        <NextIntlClientProvider messages={landingClientMessages(messages)}>
          <LandingProviders>
            {env.ENABLE_APP_TRACKING && <GlobalPropertiesUpdater />}
            {children}
          </LandingProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
