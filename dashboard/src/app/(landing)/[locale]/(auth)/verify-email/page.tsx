import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import type { SupportedLanguages } from '@/constants/i18n';
import { AuthAction, AuthPanel } from '@/landing/components/auth/authPanel';
import { NO_INDEX } from '@/landing/components/auth/metadata';
import { VerifiedRedirect } from '@/landing/components/auth/verifiedRedirect';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<{ token?: string; error?: string; verified?: string }>;
};

export const metadata: Metadata = { title: 'Betterlytics', robots: NO_INDEX };

/*
 * better-auth's emailed link verifies the token server-side and redirects here: success lands with ?verified=1,
 * failure appends ?verified=1&error=<code>, so error must win over verified. Legacy pre-migration links arrive with
 * ?token= and are treated as expired.
 */
export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, error, verified } = await searchParams;
  const t = await getTranslations('public.auth.verifyEmail');

  if (error || token) {
    const session = await getAuthSession();
    const expired = error === 'TOKEN_EXPIRED' || !error;
    return (
      <AuthPanel
        title={t('failed.title')}
        lede={t(expired ? 'failed.expiredInfo' : 'failed.genericFallback')}
        foot={<p className='text-center text-label text-muted'>{t('helpLine')}</p>}
      >
        <AuthAction
          href={session ? '/dashboards' : '/signin'}
          label={t(session ? 'returnToDashboard' : 'backToSignIn')}
        />
      </AuthPanel>
    );
  }

  if (verified) {
    const session = await getAuthSession();
    return (
      <AuthPanel title={t('success.title')} lede={t('success.description')}>
        <VerifiedRedirect hasSession={Boolean(session)} />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title={t('invalid.title')} lede={t('invalid.description')}>
      <AuthAction href='/signin' label={t('backToSignIn')} />
    </AuthPanel>
  );
}
