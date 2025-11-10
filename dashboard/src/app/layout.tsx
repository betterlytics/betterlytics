import { Inter, Inter_Tight } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { env } from '@/lib/env';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import { StructuredData } from '@/components/StructuredData';
import NextTopLoader from 'nextjs-toploader';
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import ThemeColorUpdater from '@/app/ThemeColorUpdater';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/images/favicon-dark.svg', media: '(prefers-color-scheme: light)', type: 'image/svg+xml' },
      { url: '/images/favicon-light.svg', media: '(prefers-color-scheme: dark)', type: 'image/svg+xml' },
    ],
  },
};

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
  const locale = await getLocale();

  const seoConfig = await buildSEOConfig(SEO_CONFIGS.root);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name='theme-color' content='#fff' />
        {env.ENABLE_APP_TRACKING && (
          <Script
            async
            src={`${env.PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
            data-site-id={env.APP_TRACKING_SITE_ID}
            data-server-url={`${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/track`}
            data-dynamic-urls='/dashboard/*/funnels/*,/dashboard/*,/*/public/*,/*public/*/funnels/*'
            data-web-vitals='true'
          />
        )}
        <StructuredData config={seoConfig} />
      </head>
      <body className={`${robotoSans.variable} ${robotoMono.variable} antialiased`}>
        <NextTopLoader color='var(--primary)' height={3} showSpinner={false} shadow={false} />
        <ThemeColorUpdater />
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
