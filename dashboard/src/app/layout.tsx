import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { env } from '@/lib/env';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import { generateStructuredData } from '@/lib/seo';
import NextTopLoader from 'nextjs-toploader';
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const organizationStructuredData = generateStructuredData('organization', {
  title: 'Betterlytics',
  description: 'Privacy-first, cookieless, open-source web analytics platform',
  keywords: [
    'web analytics',
    'privacy analytics',
    'cookieless analytics',
    'open source analytics',
    'GDPR compliant analytics',
    'Google Analytics alternative',
  ],
  path: '/',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {env.ENABLE_APP_TRACKING && (
          <Script
            async
            src={`${env.PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
            data-site-id={env.APP_TRACKING_SITE_ID}
            data-server-url={`${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/track`}
            data-dynamic-urls='/dashboard/*/funnels/*,/dashboard/*'
          />
        )}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextTopLoader color='var(--primary)' height={3} showSpinner={false} shadow={false} />
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
