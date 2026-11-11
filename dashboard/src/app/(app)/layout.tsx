import { NextIntlClientProvider } from 'next-intl';
import { AppDocument } from '@/app/AppDocument';
import { BASE_METADATA } from '@/app/baseMetadata';
import Providers from '@/app/Providers';
import { Toaster } from '@/components/ui/sonner';
import ThemeColorUpdater from '@/app/ThemeColorUpdater';
import { GlobalPropertiesUpdater } from '@/components/tracking/GlobalPropertiesUpdater';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { livePromo } from '@/lib/billing/promo';
import { PromoProvider } from '@/components/pricing/usePromo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  ...BASE_METADATA,
  title: 'Betterlytics',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDocument>
      <NextIntlClientProvider>
        <ThemeColorUpdater />
        <PromoProvider live={livePromo(isFeatureEnabled('isCloud')) !== null}>
          <Providers>
            {env.ENABLE_APP_TRACKING && <GlobalPropertiesUpdater />}
            {children}
          </Providers>
        </PromoProvider>
        <Toaster />
      </NextIntlClientProvider>
    </AppDocument>
  );
}
