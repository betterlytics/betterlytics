import type { Metadata } from 'next';
import { env } from '@/lib/env';

export const BASE_METADATA: Metadata = {
  icons: {
    icon: [
      { url: '/icon0.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  metadataBase: new URL(env.PUBLIC_BASE_URL),
  manifest: '/manifest.json',
};
