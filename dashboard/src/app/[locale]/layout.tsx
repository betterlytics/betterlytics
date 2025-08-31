import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicTopBar />
      {children}
      <Footer />
    </>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
