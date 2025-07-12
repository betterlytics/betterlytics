import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { env } from '@/lib/env';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import ConditionalTopBar from '@/components/topbar/ConditionalTopBar';
import ConditionalFooter from '@/components/ConditionalFooter';
import { generateSEO, SEO_CONFIGS } from '@/lib/seo';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = generateSEO(SEO_CONFIGS.landing);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      {env.ENABLE_APP_TRACKING && (
        <head>
          <Script
            async
            src={`${env.NEXT_PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
            data-site-id={env.APP_TRACKING_SITE_ID}
            data-server-url={`${env.NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT}/track`}
            data-dynamic-urls='/dashboard/*/funnels/*,/dashboard/*'
          />
        </head>
      )}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <ConditionalTopBar />
          {children}
          <ConditionalFooter />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
