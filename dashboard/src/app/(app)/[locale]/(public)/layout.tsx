import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import ThemeToggleFab from '@/components/ThemeToggleFab';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col justify-between'>
      <PublicTopBar isCloud={isFeatureEnabled('isCloud')} />
      <div className='flex flex-1 flex-col'>{children}</div>
      <Footer />
      <ThemeToggleFab />
    </div>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
