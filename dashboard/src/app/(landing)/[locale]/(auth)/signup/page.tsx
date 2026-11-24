import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { isOpenInvitation } from '@/entities/dashboard/invitation.entities';
import { acceptInvitePath, signInErrorKey, signInPath, signUpPath } from '@/lib/auth/auth-page-state';
import { getEnabledOAuthProviders } from '@/lib/better-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import { getMcpSignInRequest, signedOAuthQuery } from '@/services/auth/mcpConsent.service';
import { getSignupAllowance } from '@/services/auth/signupGate.service';
import { AuthAction, AuthPanel, AuthPrompt } from '@/landing/components/auth/authPanel';
import { ClientBadge } from '@/landing/components/auth/clientBadge';
import { authMetadata } from '@/landing/components/auth/metadata';
import { SignUpForm } from '@/landing/components/auth/signUpForm';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  // beyond invite and error, the signed query of an MCP client's authorization request
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return authMetadata(locale, 'signup');
}

export default async function SignUpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  // a repeated parameter arrives as an array, which no link of ours makes
  const invite = typeof query.invite === 'string' ? query.invite : undefined;
  const error = typeof query.error === 'string' ? query.error : undefined;

  const invitation = invite ? await findInvitationByToken(invite) : null;
  const openInvitation = invitation && isOpenInvitation(invitation) ? invitation : null;
  const acceptPath = openInvitation && invite ? acceptInvitePath(invite) : undefined;
  // an MCP client's authorization request, which signing up continues to consent, skipping onboarding
  const oauthQuery = isMcpOAuthEnabled() ? signedOAuthQuery(query) : null;
  const connect = oauthQuery ? await getMcpSignInRequest(oauthQuery) : null;
  const redirectTo = connect?.authorizeUrl ?? acceptPath;

  // signed in already, or an expired request: the authorization picks up from here
  if (connect?.status === 'stale' || (await getAuthSession())) {
    redirect(redirectTo ?? '/dashboards');
  }

  const t = await getTranslations('public.auth.register');
  const isCloud = isFeatureEnabled('isCloud');
  const structuredData = isCloud ? <StructuredData config={await buildSEOConfig(SEO_CONFIGS.signup)} /> : null;

  const allowance = await getSignupAllowance({
    email: openInvitation?.email,
    inviteToken: openInvitation ? invite : undefined,
  });
  if (!allowance) {
    return (
      <>
        {structuredData}
        <AuthPanel title={t('disabled.title')} lede={t('disabled.description')}>
          <AuthAction href={signInPath(undefined, oauthQuery)} label={t('disabled.backToSignIn')} />
        </AuthPanel>
      </>
    );
  }

  // an OAuth sign-up that came back with an error
  const errorKey = signInErrorKey(error);
  const invitedDomain = openInvitation?.dashboard?.domain;
  // "free to start" is the cloud's offer; a self-hosted instance says what the account is for
  const client = connect?.client;
  const lede = invitedDomain
    ? t('invited', { domain: invitedDomain })
    : allowance === 'first_user'
      ? t('ledeFirstUser')
      : isCloud
        ? t('lede')
        : t('ledeSelfHosted');
  return (
    <>
      {structuredData}
      <AuthPanel
        title={
          client ? (
            <>
              {t('connectTitle', { client: client.name })}{' '}
              <ClientBadge verified={client.verified} className='align-middle' />
            </>
          ) : (
            t('title')
          )
        }
        lede={lede}
        foot={
          <AuthPrompt
            lead={t('haveAccount')}
            // an invitee who has an account after all signs in and lands on the invitation
            href={signInPath(acceptPath, oauthQuery)}
            label={t('signIn')}
          />
        }
      >
        <SignUpForm
          providers={getEnabledOAuthProviders()}
          invitedEmail={openInvitation?.email}
          inviteToken={openInvitation ? invite : undefined}
          redirectTo={redirectTo}
          connectPath={connect ? signUpPath(openInvitation ? invite : undefined, oauthQuery) : undefined}
          requireTerms={isCloud}
          initialError={errorKey ? (await getTranslations('public.auth.signin'))(`errors.${errorKey}`) : null}
        />
      </AuthPanel>
    </>
  );
}
