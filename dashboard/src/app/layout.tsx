import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { env } from '@/lib/env';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import ConditionalTopBar from '@/components/topbar/ConditionalTopBar';
import ConditionalFooter from '@/components/ConditionalFooter';
import { generateSEO, SEO_CONFIGS, generateStructuredData } from '@/lib/seo';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = generateSEO(SEO_CONFIGS.landing);

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {env.ENABLE_APP_TRACKING && (
          <Script
            async
            src={`${env.NEXT_PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
            data-site-id={env.APP_TRACKING_SITE_ID}
            data-server-url={`${env.NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT}/track`}
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col`}>
        <Providers>
          <ConditionalTopBar />
          <div className="scrollable-y">
            {children}
            <ConditionalFooter />
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
