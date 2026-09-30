import { NextIntlClientProvider } from 'next-intl';
import { AppDocument } from '@/app/AppDocument';
import { BASE_METADATA } from '@/app/baseMetadata';
import Providers from '@/app/Providers';
import ThemeColorUpdater from '@/app/ThemeColorUpdater';
import { GlobalPropertiesUpdater } from '@/components/tracking/GlobalPropertiesUpdater';
import { env } from '@/lib/env';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  ...BASE_METADATA,
  title: 'Betterlytics',
};

/** Root layout for the app: the dashboard, the public pages and the auth flows. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDocument>
      <NextIntlClientProvider>
        <ThemeColorUpdater />
        <Providers>
          {env.ENABLE_APP_TRACKING && <GlobalPropertiesUpdater />}
          {children}
        </Providers>
      </NextIntlClientProvider>
    </AppDocument>
  );
}
