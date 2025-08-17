import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/supportedLanguages';

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
