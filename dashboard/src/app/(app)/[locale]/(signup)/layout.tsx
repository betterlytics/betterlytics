import { MinimalFooter } from '@/components/footer/MinimalFooter';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';
import ThemeToggleFab from '@/components/ThemeToggleFab';

export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col justify-between'>
      <div className='flex flex-1 flex-col'>{children}</div>
      <MinimalFooter />
      <ThemeToggleFab />
    </div>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
