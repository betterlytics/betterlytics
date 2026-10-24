import { appFontVariables } from '@/app/appFonts';
import './globals.css';
import BaseProviders from '@/app/BaseProviders';
import { StructuredData } from '@/components/StructuredData';
import { AppTrackingScript } from '@/components/tracking/AppTrackingScript';
import NextTopLoader from 'nextjs-toploader';
import { getLocale } from 'next-intl/server';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { env } from '@/lib/env';
import { headers } from 'next/headers';
import { getSessionCookie } from 'better-auth/cookies';

export async function AppDocument({ children }: { children: React.ReactNode }) {
  const isCloud = isFeatureEnabled('isCloud');
  const [locale, seoConfig, sessionToken] = await Promise.all([
    getLocale(),
    isCloud ? buildSEOConfig(SEO_CONFIGS.root) : null,
    env.ENABLE_APP_TRACKING ? headers().then(getSessionCookie) : undefined,
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name='theme-color' content='#fff' />
        <AppTrackingScript globalProperties={{ surface: 'app', logged_in: Boolean(sessionToken), locale }} />
        {seoConfig && <StructuredData config={seoConfig} />}
      </head>
      <body className={`${appFontVariables} antialiased`}>
        <NextTopLoader color='var(--primary)' height={3} showSpinner={false} shadow={false} />
        <BaseProviders>{children}</BaseProviders>
      </body>
    </html>
  );
}
