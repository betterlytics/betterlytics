'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/landing/lib/cn';
import { PanelLink } from './authPanel';
import { Alert } from './fields';
import { Spinner } from './icons';
import styles from './authForm.module.css';

const PAUSE_MS = 2000;
const TIMEOUT_MS = 5000;

/** Moves on with a full load, so the next page reads the now-verified session afresh. */
export function VerifiedRedirect({ hasSession }: { hasSession: boolean }) {
  const t = useTranslations('public.auth.verifyEmail');
  const [stalled, setStalled] = useState(false);
  const target = hasSession ? '/dashboards' : '/signin';

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const pause = setTimeout(() => {
      window.location.assign(target);
      timeout = setTimeout(() => setStalled(true), TIMEOUT_MS);
    }, PAUSE_MS);
    return () => {
      clearTimeout(pause);
      clearTimeout(timeout);
    };
  }, [target]);

  return (
    <div className={styles.root}>
      {stalled ? (
        <Alert id='verify-redirect-stalled'>{t('success.redirectTimeout')}</Alert>
      ) : (
        <p className={styles.note} role='status'>
          <Spinner className={cn(styles.spin, 'mr-2 inline-block align-[-3px]')} />
          {t(hasSession ? 'success.redirecting' : 'success.redirectingToSignin')}
        </p>
      )}
      <PanelLink className={styles.secondary} href={target}>
        {t(hasSession ? 'returnToDashboard' : 'backToSignIn')}
      </PanelLink>
    </div>
  );
}
