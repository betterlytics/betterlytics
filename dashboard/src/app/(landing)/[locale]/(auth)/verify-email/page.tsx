import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import type { SupportedLanguages } from '@/constants/i18n';
import { verifyEmailState } from '@/lib/auth/auth-page-state';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { AuthAction, AuthPanel } from '@/landing/components/auth/authPanel';
import { NO_INDEX } from '@/landing/components/auth/metadata';
import { ResendVerification } from '@/landing/components/auth/resendVerification';
import { VerifiedRedirect } from '@/landing/components/auth/verifiedRedirect';
import { FINE_LINK } from '@/landing/components/ui/text';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<{ token?: string; error?: string; verified?: string }>;
};

export const metadata: Metadata = { title: 'Betterlytics', robots: NO_INDEX };

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const state = verifyEmailState(await searchParams);
  const t = await getTranslations('public.auth.verifyEmail');
  const session = await getAuthSession();

  if (state === 'verified') {
    return (
      <AuthPanel title={t('success.title')} lede={t('success.description')}>
        <VerifiedRedirect hasSession={Boolean(session)} />
      </AuthPanel>
    );
  }

  // an old link or a second click, with the account verified by now: nothing is wrong
  if (session?.user.emailVerified) {
    return (
      <AuthPanel title={t('alreadyVerifiedTitle')} lede={t('success.description')}>
        <AuthAction href='/dashboards' label={t('returnToDashboard')} />
      </AuthPanel>
    );
  }

  // an instance that never sends links (self-host) has nothing to offer here
  if (!isFeatureEnabled('enableAccountVerification')) {
    redirect(session ? '/dashboards' : '/signin');
  }

  const isLinkProblem = state === 'expired' || state === 'failed';
  const back = session
    ? { href: '/dashboards', label: t('returnToDashboard') }
    : { href: '/signin', label: t('backToSignIn') };
  return (
    <AuthPanel
      title={t(state === 'expired' ? 'failed.expiredTitle' : isLinkProblem ? 'failed.title' : 'invalid.title')}
      lede={t(
        state === 'expired'
          ? 'failed.expiredInfo'
          : state === 'failed'
            ? 'failed.genericFallback'
            : 'invalid.description',
      )}
      // our support address is the cloud's; a self-hosted instance has its own administrator
      foot={
        isLinkProblem && isFeatureEnabled('isCloud') ? (
          <p className='text-center text-label text-muted'>
            {t.rich('helpLine', {
              mail: (chunks) => (
                <a className={FINE_LINK} href='mailto:support@betterlytics.io'>
                  {chunks}
                </a>
              ),
            })}
          </p>
        ) : null
      }
    >
      <ResendVerification accountEmail={session?.user.email} back={back} />
    </AuthPanel>
  );
}
