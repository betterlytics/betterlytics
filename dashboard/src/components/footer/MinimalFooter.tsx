import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { FooterLanguageSelector } from './FooterLanguageSelector';

export async function MinimalFooter() {
  const t = await getTranslations('public.footer');

  return (
    <footer className='border-border/40 mt-auto w-full border-t py-6'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='flex flex-wrap items-center justify-center gap-4 text-sm'>
            <FooterLanguageSelector />
            <Link href='/privacy' className='text-muted-foreground hover:text-foreground transition-colors'>
              {t('privacyPolicy')}
            </Link>
            <Link href='/terms' className='text-muted-foreground hover:text-foreground transition-colors'>
              {t('termsOfService')}
            </Link>
            <Link href='/contact' className='text-muted-foreground hover:text-foreground transition-colors'>
              {t('contact')}
            </Link>
          </div>
          <p className='text-muted-foreground text-center text-sm'>
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
