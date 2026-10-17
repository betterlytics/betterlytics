import { Inter, Inter_Tight } from 'next/font/google';
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

const robotoSans = Inter({
  variable: '--font-roboto-sans',
  subsets: ['latin'],
  weight: '400',
});

const robotoMono = Inter_Tight({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

/** `lang` overrides the visitor's locale for pages that render in a fixed language. */
export async function AppDocument({ children, lang }: { children: React.ReactNode; lang?: string }) {
  const isCloud = isFeatureEnabled('isCloud');
  const [locale, seoConfig, sessionToken] = await Promise.all([
    lang ?? getLocale(),
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
      <body className={`${robotoSans.variable} ${robotoMono.variable} antialiased`}>
        <NextTopLoader color='var(--primary)' height={3} showSpinner={false} shadow={false} />
        <BaseProviders>{children}</BaseProviders>
      </body>
    </html>
  );
}
