import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import ConditionalTopBar from '@/components/topbar/ConditionalTopBar';
import ConditionalFooter from '@/components/ConditionalFooter';
import { generateSEO, SEO_CONFIGS, generateStructuredData } from '@/lib/seo';
import { BetterlyticsTracker } from '@/components/BetterlyticsTracker';

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
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        <BetterlyticsTracker />
      </head>
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
