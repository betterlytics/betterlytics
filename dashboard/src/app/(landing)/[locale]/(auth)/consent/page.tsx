import type { Metadata } from 'next';
import { AvatarMode } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import type { SupportedLanguages } from '@/constants/i18n';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import { getMcpConsentRequest, signedOAuthQuery } from '@/services/auth/mcpConsent.service';
import { getCachedUserSettings } from '@/services/account/userSettings.service';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';
import { AuthAction, AuthPanel } from '@/landing/components/auth/authPanel';
import { ConsentPanel } from '@/landing/components/auth/consentPanel';
import { NO_INDEX } from '@/landing/components/auth/metadata';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: 'Betterlytics', robots: NO_INDEX };

export default async function ConsentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isMcpOAuthEnabled()) {
    notFound();
  }

  const oauthQuery = signedOAuthQuery(await searchParams);
  const session = await getAuthSession();
  // signed out since the request started: sign-in carries the request on and comes back here
  if (oauthQuery && !session) {
    redirect(`/${locale}/signin?${oauthQuery}`);
  }

  const request = oauthQuery && session ? await getMcpConsentRequest(session.user.id, oauthQuery) : null;
  if (!oauthQuery || !session || !request) {
    const t = await getTranslations('public.auth.consent');
    return (
      <AuthPanel title={t('invalidTitle')} lede={t('invalidLede')}>
        <AuthAction href='/dashboards' label={t('goToDashboards')} />
      </AuthPanel>
    );
  }

  const settings = await getCachedUserSettings(session.user.id);
  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={getPublicEnvironmentVariables()}>
      <ConsentPanel
        request={request}
        oauthQuery={oauthQuery}
        email={session.user.email}
        gravatar={settings.avatar === AvatarMode.gravatar}
      />
    </PublicEnvironmentVariablesProvider>
  );
}
