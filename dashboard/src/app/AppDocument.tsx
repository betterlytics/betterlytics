import { Inter, Inter_Tight } from 'next/font/google';
import './globals.css';
import BaseProviders from '@/app/BaseProviders';
import { StructuredData } from '@/components/StructuredData';
import { AppTrackingScript } from '@/components/tracking/AppTrackingScript';
import NextTopLoader from 'nextjs-toploader';
import { getLocale } from 'next-intl/server';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
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

/** Shared by the app and status root layouts; per-request, unlike the landing's static document. */
export async function AppDocument({ children }: { children: React.ReactNode }) {
  const [locale, seoConfig, sessionToken] = await Promise.all([
    getLocale(),
    buildSEOConfig(SEO_CONFIGS.root),
    env.ENABLE_APP_TRACKING ? headers().then(getSessionCookie) : undefined,
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name='theme-color' content='#fff' />
        <AppTrackingScript globalProperties={{ surface: 'app', logged_in: Boolean(sessionToken), locale }} />
        <StructuredData config={seoConfig} />
      </head>
      <body className={`${robotoSans.variable} ${robotoMono.variable} antialiased`}>
        <NextTopLoader color='var(--primary)' height={3} showSpinner={false} shadow={false} />
        <BaseProviders>{children}</BaseProviders>
      </body>
    </html>
  );
}
