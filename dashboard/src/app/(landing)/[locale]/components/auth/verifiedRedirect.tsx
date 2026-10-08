'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import { Alert } from './fields';
import { Spinner } from './icons';
import styles from './authForm.module.css';

const PAUSE_MS = 2000;
const TIMEOUT_MS = 5000;

/** Says the address is confirmed, then moves on: to the dashboards when signed in, else to sign in. */
export function VerifiedRedirect({ hasSession }: { hasSession: boolean }) {
  const t = useTranslations('public.auth.verifyEmail');
  const { refreshSession } = useSessionRefresh();
  const { isPending } = authClient.useSession();
  const [stalled, setStalled] = useState(false);
  const target = hasSession ? '/dashboards' : '/signin';

  useEffect(() => {
    if (isPending) return;
    let timeout: ReturnType<typeof setTimeout>;
    const pause = setTimeout(async () => {
      // the session still says unverified until it is fetched again
      if (hasSession) await refreshSession();
      window.location.assign(target);
      timeout = setTimeout(() => setStalled(true), TIMEOUT_MS);
    }, PAUSE_MS);
    return () => {
      clearTimeout(pause);
      clearTimeout(timeout);
    };
  }, [isPending, hasSession, refreshSession, target]);

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
      <Link className={styles.secondary} href={target}>
        {t(hasSession ? 'returnToDashboard' : 'backToSignIn')}
      </Link>
    </div>
  );
}
