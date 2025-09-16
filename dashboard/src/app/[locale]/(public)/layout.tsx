import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import ThemeToggleFab from '@/components/ThemeToggleFab';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col justify-between'>
      <PublicTopBar />
      <div className='flex flex-1 flex-col'>{children}</div>
      <Footer />
      <ThemeToggleFab />
    </div>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
