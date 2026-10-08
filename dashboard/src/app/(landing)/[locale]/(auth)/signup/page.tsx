import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { isOpenInvitation } from '@/entities/dashboard/invitation.entities';
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
  const acceptPath = openInvitation ? `/accept-invite/${invite}` : undefined;

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

  const invitedDomain = openInvitation?.dashboard?.domain;
  return (
    <>
      {structuredData}
      <AuthPanel
        title={t('title')}
        lede={invitedDomain ? t('invited', { domain: invitedDomain }) : t('lede')}
        foot={<AuthPrompt lead={t('haveAccount')} href='/signin' label={t('signIn')} />}
      >
        <SignUpForm
          providers={getEnabledOAuthProviders()}
          invitedEmail={openInvitation?.email}
          inviteToken={openInvitation ? invite : undefined}
          redirectTo={acceptPath}
          requireTerms={isFeatureEnabled('isCloud')}
        />
      </AuthPanel>
    </>
  );
}
