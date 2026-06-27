import { NextIntlClientProvider } from 'next-intl';
import Providers from '@/app/Providers';
import ThemeColorUpdater from '@/app/ThemeColorUpdater';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <ThemeColorUpdater />
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
