import { Inter, Inter_Tight } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { env } from '@/lib/env';
import BaseProviders from '@/app/BaseProviders';
import { StructuredData } from '@/components/StructuredData';
import NextTopLoader from 'nextjs-toploader';
import { getLocale } from 'next-intl/server';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, seoConfig, sessionToken] = await Promise.all([
    getLocale(),
    buildSEOConfig(SEO_CONFIGS.root),
    env.ENABLE_APP_TRACKING ? headers().then(getSessionCookie) : undefined,
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name='theme-color' content='#fff' />
        {env.ENABLE_APP_TRACKING && (
          <Script
            async
            src={`${env.PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
            data-site-id={env.APP_TRACKING_SITE_ID}
            data-server-url={`${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/event`}
            data-dynamic-urls='/dashboard/*/errors/detail/*,/dashboard/*/funnels/*,/dashboard/*/monitoring/*,/dashboard/*/status-pages/*,/dashboard/*,/share/*/errors/detail/*,/*/share/*/errors/detail/*,/share/*/funnels/*,/*/share/*/funnels/*,/share/*/monitoring/*,/*/share/*/monitoring/*,/share/*/status-pages/*,/*/share/*/status-pages/*,/share/*,/*/share/*,/accept-invite/*,/*/accept-invite/*,/status/*'
            data-web-vitals='true'
            data-track-errors='true'
            data-track-console-errors='true'
            data-global-properties={JSON.stringify({ surface: 'app', logged_in: Boolean(sessionToken), locale })}
          />
        )}
        <StructuredData config={seoConfig} />
      </head>
      <body className={`${robotoSans.variable} ${robotoMono.variable} antialiased`}>
        <NextTopLoader color='var(--primary)' height={3} showSpinner={false} shadow={false} />
        <BaseProviders>{children}</BaseProviders>
      </body>
    </html>
  );
}
