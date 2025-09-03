import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col justify-between'>
      <div>
        <PublicTopBar />
        {children}
      </div>
      <Footer />
    </div>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
