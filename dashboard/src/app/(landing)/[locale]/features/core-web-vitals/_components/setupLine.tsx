import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/CopyButton';
import { buttonStyles } from '@/landing/components/ui/button';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { LINKS } from '@/landing/lib/links';
import styles from './setupLine.module.css';

const ATTRIBUTE = 'data-web-vitals="true"';

/** The attribute on its own, with the rest of the script tag dimmed around it. */
export function SetupLine() {
  const t = useTranslations('landing.vitals.setup');
  return (
    <div className={styles.line}>
      <p className={styles.label}>{t('label')}</p>
      <div className={styles.code}>
        <code>
          <span className={styles.dim}>{'<script … '}</span>
          <span className={styles.attr}>{ATTRIBUTE}</span>
          <span className={styles.dim}>{'>'}</span>
        </code>
        <CopyButton
          text={ATTRIBUTE}
          ariaLabel={t('copy')}
          copiedLabel={t('copied')}
          className={styles.copy}
          iconClassName='size-4'
        />
      </div>
      <p className={styles.npm}>
        {t.rich('npm', {
          link: (chunks) => (
            <a href={LINKS.trackerNpm} target='_blank' rel='noopener noreferrer'>
              {chunks}
            </a>
          ),
          code: (chunks) => <code>{chunks}</code>,
        })}
      </p>
      <TrackedAnchor
        className={buttonStyles({ variant: 'line', size: 'sm' })}
        href={LINKS.vitalsDocs}
        placement='setup'
        destination='docs'
      >
        {t('cta')}
      </TrackedAnchor>
    </div>
  );
}
