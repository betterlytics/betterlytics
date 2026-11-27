import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import {
  inviteTokenFromCallback,
  signInErrorKey,
  signInPath,
  signInRedirectPath,
  signUpPath,
} from '@/lib/auth/auth-page-state';
import { getEnabledOAuthProviders } from '@/lib/better-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import { getMcpSignInRequest, signedOAuthQuery } from '@/services/auth/mcpConsent.service';
import { isFirstUser } from '@/services/auth/signupGate.service';
import { AuthPanel, AuthPrompt } from '@/landing/components/auth/authPanel';
import { ClientBadge } from '@/landing/components/auth/clientBadge';
import { authMetadata } from '@/landing/components/auth/metadata';
import { SignInForm } from '@/landing/components/auth/signInForm';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  // beyond these, the signed query of an MCP client's authorization request
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return authMetadata(locale, 'signin');
}

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const error = typeof query.error === 'string' ? query.error : undefined;
  // an MCP client's authorization request, which signing in (or up) continues
  const oauthQuery = isMcpOAuthEnabled() ? signedOAuthQuery(query) : null;
  const connect = oauthQuery ? await getMcpSignInRequest(oauthQuery) : null;
  const redirectTo = connect?.authorizeUrl ?? signInRedirectPath(query.callbackUrl);

  // an expired request starts over; signed in already, the authorization picks up from here unless it asks the
  // visitor to sign in again, which this form does
  if (connect?.status === 'stale') {
    redirect(connect.authorizeUrl);
  }
  if (await getAuthSession()) {
    if (!connect) redirect(redirectTo);
    if (connect.signedInUrl) redirect(connect.signedInUrl);
  }

  const registrationEnabled = isFeatureEnabled('enableRegistration');
  // a fresh self-hosted instance has nobody to sign in as yet
  if (!registrationEnabled && (await isFirstUser())) {
    redirect('/signup');
  }

  const t = await getTranslations('public.auth.signin');
  const errorKey = signInErrorKey(error);
  // headed for an invitation: sign-up carries it on, and it opens sign-up even where registration is off
  const inviteToken = connect ? null : inviteTokenFromCallback(redirectTo);
  const client = connect?.client;

  return (
    <>
      {isFeatureEnabled('isCloud') && <StructuredData config={await buildSEOConfig(SEO_CONFIGS.signin)} />}
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
        lede={client ? t('connectLede', { client: client.name }) : t('lede')}
        foot={
          registrationEnabled || inviteToken ? (
            <AuthPrompt
              lead={t('noAccount')}
              href={signUpPath(inviteToken, oauthQuery)}
              label={t('createAccount')}
            />
          ) : (
            <p className='text-center text-label text-muted'>{t('askAdmin')}</p>
          )
        }
      >
        <SignInForm
          providers={getEnabledOAuthProviders()}
          forgotPassword={isFeatureEnabled('enableEmails')}
          redirectTo={redirectTo}
          connectPath={connect ? signInPath(undefined, oauthQuery) : undefined}
          initialError={errorKey ? t(`errors.${errorKey}`) : null}
          notice={query.registration === 'disabled' ? t('registrationDisabled') : null}
        />
      </AuthPanel>
    </>
  );
}
