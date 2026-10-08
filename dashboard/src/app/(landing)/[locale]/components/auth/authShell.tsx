import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { LANGUAGE_METADATA, SUPPORTED_LANGUAGES } from '@/constants/i18n';
import { Link } from '@/i18n/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { BrandLink, BrandMarkDefs } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { LINKS } from '@/landing/lib/links';
import { CurrentPageLanguageLinks } from './languageLinks';
import styles from './authShell.module.css';

const QUIET_LINK = 'text-muted transition-colors duration-180 ease-out-expo hover:text-fg';

/** The page around every auth step: the brand and links on top, the panel in the middle, the fine print below. */
export async function AuthShell({ children }: { children: ReactNode }) {
  const t = await getTranslations('public.auth.shell');
  const tNav = await getTranslations('landing.nav');
  const tFooter = await getTranslations('landing.footer');

  return (
    <div className={styles.root}>
      <BrandMarkDefs />
      <header className={styles.top}>
        <BrandLink />
        <div className='flex items-center gap-5 text-body font-medium tracking-ui'>
          <a className={QUIET_LINK} href={LINKS.docs}>
            {tNav('docs')}
          </a>
          <a
            className={cn(
              QUIET_LINK,
              'inline-flex size-8 items-center justify-center rounded-[7px] hover:bg-fg/6',
            )}
            href={LINKS.github}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={tNav('githubLabel')}
          >
            <GitHubIcon className='size-[17px]' />
          </a>
        </div>
      </header>

      <main className={styles.middle}>{children}</main>

      <footer className={styles.bottom}>
        <span className='text-caption text-muted'>© {new Date().getFullYear()} Betterlytics</span>
        {/* our policies govern the cloud only; on self-host these pages don't exist and bounce back to sign-in */}
        {isFeatureEnabled('isCloud') ? (
          <nav className='flex items-center gap-5 text-caption text-muted' aria-label={t('legal')}>
            <Link className={QUIET_LINK} href='/privacy'>
              {t('privacy')}
            </Link>
            <Link className={QUIET_LINK} href='/terms'>
              {t('terms')}
            </Link>
          </nav>
        ) : null}
        <CurrentPageLanguageLinks
          label={tFooter('language')}
          languages={SUPPORTED_LANGUAGES.map((code) => ({ code, name: LANGUAGE_METADATA[code].name }))}
        />
      </footer>
    </div>
  );
}
