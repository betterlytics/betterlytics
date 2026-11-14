import { NextIntlClientProvider } from 'next-intl';
import { AppDocument, type AppDocumentProps } from '@/app/AppDocument';
import Providers from '@/app/Providers';
import ThemeColorUpdater from '@/app/ThemeColorUpdater';
import { Toaster } from '@/components/ui/sonner';
import { GlobalPropertiesUpdater } from '@/components/tracking/GlobalPropertiesUpdater';
import { env } from '@/lib/env';

export function AppShell({ children, ...documentProps }: AppDocumentProps) {
  return (
    <AppDocument {...documentProps}>
      <NextIntlClientProvider>
        <ThemeColorUpdater />
        <Providers>
          {env.ENABLE_APP_TRACKING && <GlobalPropertiesUpdater />}
          {children}
        </Providers>
        <Toaster />
      </NextIntlClientProvider>
    </AppDocument>
  );
}
