import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { LANGUAGE_METADATA, SUPPORTED_LANGUAGES } from '@/constants/i18n';
import { Link } from '@/i18n/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { BrandLink, BrandMarkDefs } from '@/landing/components/ui/brandMark';
import { LanguageMenu } from './languageMenu';
import styles from './authShell.module.css';

const QUIET_LINK = 'text-muted transition-colors duration-180 ease-out-expo hover:text-fg';

/** Only the brand on top, so nothing leads away mid-form. */
export async function AuthShell({ children }: { children: ReactNode }) {
  const t = await getTranslations('public.auth.shell');
  const tFooter = await getTranslations('landing.footer');

  return (
    <div className={styles.root}>
      <BrandMarkDefs />
      <header className={styles.top}>
        <BrandLink />
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
        <LanguageMenu
          label={tFooter('language')}
          languages={SUPPORTED_LANGUAGES.map((code) => ({ code, name: LANGUAGE_METADATA[code].name }))}
        />
      </footer>
    </div>
  );
}
