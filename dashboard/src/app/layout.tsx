import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import ConditionalTopBar from '@/components/topbar/ConditionalTopBar';
import ConditionalFooter from '@/components/ConditionalFooter';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Betterlytics – Simple, Privacy-Friendly Website Analytics',
  description:
    'Betterlytics helps you track your website traffic with clean, real-time insights. No cookies, no bloat – just better analytics built for speed, privacy, and clarity.',
  icons: {
    icon: [
      { url: '/images/favicon-dark.svg', media: '(prefers-color-scheme: light)', type: 'image/svg+xml' },
      { url: '/images/favicon-light.svg', media: '(prefers-color-scheme: dark)', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
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
