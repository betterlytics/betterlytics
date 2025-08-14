import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { NextIntlClientProvider } from 'next-intl';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <PublicTopBar />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'da' }];
}
