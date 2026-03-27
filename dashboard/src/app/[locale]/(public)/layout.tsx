import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import ThemeToggleFab from '@/components/ThemeToggleFab';
import { BackgroundProvider } from '@/components/landing/background-context';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundProvider>
      <div className='flex min-h-screen flex-col justify-between'>
        <PublicTopBar />
        <div className='flex flex-1 flex-col'>{children}</div>
        <Footer />
        <ThemeToggleFab />
      </div>
    </BackgroundProvider>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
