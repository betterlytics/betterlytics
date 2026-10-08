import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { isOpenInvitation } from '@/entities/dashboard/invitation.entities';
import { acceptInvitePath } from '@/lib/auth/auth-page-state';
import { getEnabledOAuthProviders } from '@/lib/better-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { getSignupAllowance } from '@/services/auth/signupGate.service';
import { AuthAction, AuthPanel, AuthPrompt } from '@/landing/components/auth/authPanel';
import { authMetadata } from '@/landing/components/auth/metadata';
import { SignUpForm } from '@/landing/components/auth/signUpForm';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<{ invite?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return authMetadata(locale, 'signup');
}

export default async function SignUpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { invite } = await searchParams;

  const invitation = invite ? await findInvitationByToken(invite) : null;
  const openInvitation = invitation && isOpenInvitation(invitation) ? invitation : null;
  const acceptPath = openInvitation && invite ? acceptInvitePath(invite) : undefined;

  if (await getAuthSession()) {
    redirect(acceptPath ?? '/dashboards');
  }

  const t = await getTranslations('public.auth.register');
  const structuredData = <StructuredData config={await buildSEOConfig(SEO_CONFIGS.signup)} />;

  const allowed = await getSignupAllowance({
    email: openInvitation?.email,
    inviteToken: openInvitation ? invite : undefined,
  });
  if (!allowed) {
    return (
      <>
        {structuredData}
        <AuthPanel title={t('disabled.title')} lede={t('disabled.description')}>
          <AuthAction href='/signin' label={t('disabled.backToSignIn')} />
        </AuthPanel>
      </>
    );
  }

  const isCloud = isFeatureEnabled('isCloud');
  const invitedDomain = openInvitation?.dashboard?.domain;
  // "free to start" is the cloud's offer; a self-hosted instance says what the account is for
  const lede = invitedDomain
    ? t('invited', { domain: invitedDomain })
    : isCloud
      ? t('lede')
      : (await getTranslations('public.auth.signin'))('lede');
  return (
    <>
      {structuredData}
      <AuthPanel
        title={t('title')}
        lede={lede}
        foot={
          <AuthPrompt
            lead={t('haveAccount')}
            // an invitee who has an account after all signs in and lands on the invitation
            href={acceptPath ? `/signin?callbackUrl=${encodeURIComponent(acceptPath)}` : '/signin'}
            label={t('signIn')}
          />
        }
      >
        <SignUpForm
          providers={getEnabledOAuthProviders()}
          invitedEmail={openInvitation?.email}
          inviteToken={openInvitation ? invite : undefined}
          redirectTo={acceptPath}
          requireTerms={isCloud}
        />
      </AuthPanel>
    </>
  );
}
