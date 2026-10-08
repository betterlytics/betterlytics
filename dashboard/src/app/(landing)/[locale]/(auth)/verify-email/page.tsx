import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import type { SupportedLanguages } from '@/constants/i18n';
import { verifyEmailState } from '@/lib/auth/auth-page-state';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { AuthAction, AuthPanel } from '@/landing/components/auth/authPanel';
import { NO_INDEX } from '@/landing/components/auth/metadata';
import { VerifiedRedirect } from '@/landing/components/auth/verifiedRedirect';

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

  if (state === 'expired' || state === 'failed') {
    const session = await getAuthSession();
    return (
      <AuthPanel
        title={t('failed.title')}
        lede={t(state === 'expired' ? 'failed.expiredInfo' : 'failed.genericFallback')}
        // our support address is the cloud's; a self-hosted instance has its own administrator
        foot={
          isFeatureEnabled('isCloud') ? <p className='text-center text-label text-muted'>{t('helpLine')}</p> : null
        }
      >
        <AuthAction
          href={session ? '/dashboards' : '/signin'}
          label={t(session ? 'returnToDashboard' : 'backToSignIn')}
        />
      </AuthPanel>
    );
  }

  if (state === 'verified') {
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
