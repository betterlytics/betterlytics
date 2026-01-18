import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import ExternalLink from '@/components/ExternalLink';

export async function MinimalFooter() {
  const t = await getTranslations('public.footer');

  return (
    <footer className='border-border/40 border-t py-6'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6'>
          <p className='text-muted-foreground text-sm'>
            © {new Date().getFullYear()} Betterlytics ·{' '}
            <ExternalLink
              href='https://github.com/betterlytics/betterlytics'
              className='hover:text-foreground transition-colors'
            >
              Open source under AGPL-3.0
            </ExternalLink>
          </p>
          <div className='text-muted-foreground flex items-center gap-4 text-sm'>
            <Link href='/privacy' className='hover:text-foreground transition-colors'>
              {t('privacyPolicy')}
            </Link>
            <span className='text-border'>·</span>
            <Link href='/terms' className='hover:text-foreground transition-colors'>
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
