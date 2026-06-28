import { NextIntlClientProvider } from 'next-intl';
import Providers from '@/app/Providers';
import ThemeColorUpdater from '@/app/ThemeColorUpdater';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Betterlytics',
  icons: {
    icon: [
      { url: '/icon0.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  metadataBase: new URL('https://betterlytics.io'),
  manifest: '/manifest.json',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <ThemeColorUpdater />
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
