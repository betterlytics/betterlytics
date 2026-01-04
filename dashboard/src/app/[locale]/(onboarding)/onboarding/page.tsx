import { isFeatureEnabled } from '@/lib/feature-flags';
import { getFirstUserDashboardAction } from '@/app/actions/index.actions';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { getProviders } from 'next-auth/react';
import OnboardingPage from './OnboardingPage';
import { OnboardingProvider } from './OnboardingProvider';
import { SupportedLanguages } from '@/constants/i18n';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';
import { acceptPendingInvitations } from '@/services/dashboard/invitation.service';
import { setOnboardingCompletedAction } from '@/app/actions/account/onboarding.action';

export default async function Onboarding() {
  const session = await getAuthSession();

  const getFirstDashboard = async () => {
    if (session?.user?.id && session?.user?.email) {
      const acceptedInvitations = await acceptPendingInvitations(session.user.id, session.user.email);
      const dashboard = await getFirstUserDashboardAction();

      if (acceptedInvitations.length > 0) {
        await setOnboardingCompletedAction();
      }

      if (dashboard.success && dashboard.data) {
        return { dashboard: dashboard.data, acceptedCount: acceptedInvitations.length };
      }
    }

    return null;
  };

  const result = await getFirstDashboard();
  const { dashboard, acceptedCount } = result ?? { dashboard: null, acceptedCount: 0 };

  const getStep = () => {
    if (!session) {
      if (!isFeatureEnabled('enableRegistration')) {
        redirect('/signin?registration=disabled');
      }
      return 'account';
    }

    if (!dashboard) {
      return 'website';
    }

    if (session.user.onboardingCompletedAt || acceptedCount > 0) {
      redirect('/dashboards');
    }

    return 'integration';
  };

  const providers = await getProviders();
  const initialStep = await getStep();

  const seoConfig = await buildSEOConfig(SEO_CONFIGS.onboarding);

  return (
    <>
      <StructuredData config={seoConfig} />
      <OnboardingProvider initialDashboard={dashboard}>
        <OnboardingPage initialStep={initialStep} providers={providers} />
      </OnboardingProvider>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.onboarding);
  return generateSEO(seoConfig, {
    locale,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-image-preview': 'none',
        'max-snippet': 0,
        'max-video-preview': 0,
      },
    },
  });
}
