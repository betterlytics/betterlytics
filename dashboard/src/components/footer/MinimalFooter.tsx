import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { FooterLanguageSelector } from './FooterLanguageSelector';
import { CloudOnly } from '@/components/CloudOnly';
import ExternalLink from '@/components/ExternalLink';
import { isFeatureEnabled } from '@/lib/feature-flags';

const LINK_CLASS = 'text-muted-foreground hover:text-foreground transition-colors';

export async function MinimalFooter() {
  const t = await getTranslations('public.footer');
  const isCloud = isFeatureEnabled('isCloud');

  return (
    <footer className='border-border/40 mt-auto w-full border-t py-6'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='flex flex-wrap items-center justify-center gap-4 text-sm'>
            <FooterLanguageSelector />
            <CloudOnly>
              <Link href='/privacy' className={LINK_CLASS}>
                {t('privacyPolicy')}
              </Link>
              <Link href='/terms' className={LINK_CLASS}>
                {t('termsOfService')}
              </Link>
              <Link href='/contact' className={LINK_CLASS}>
                {t('contact')}
              </Link>
            </CloudOnly>
            {!isCloud && (
              <>
                <ExternalLink
                  href='https://betterlytics.io/docs'
                  title={t('documentation')}
                  className={LINK_CLASS}
                >
                  {t('documentation')}
                </ExternalLink>
                <ExternalLink
                  href='https://github.com/betterlytics/betterlytics'
                  className={LINK_CLASS}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {t('github')}
                </ExternalLink>
                <ExternalLink
                  href='https://discord.com/invite/vwqSvPn6sP'
                  className={LINK_CLASS}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {t('discord')}
                </ExternalLink>
              </>
            )}
          </div>
          <p className='text-muted-foreground text-center text-sm'>
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
