import { isFeatureEnabled } from '@/lib/feature-flags';
import { getFirstUserDashboardAction, isUserInvitedDashboardMemberAction } from '@/app/actions/index.actions';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import OnboardingPage from './OnboardingPage';
import { OnboardingProvider } from './OnboardingProvider';
import { SupportedLanguages } from '@/constants/i18n';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';

export default async function Onboarding() {
  const session = await getAuthSession();

  if (!session) {
    if (!isFeatureEnabled('enableRegistration')) {
      redirect('/signin?registration=disabled');
    }
    redirect('/signup');
  }

  const getFirstDashboard = async () => {
    if (session?.user?.id && session?.user?.email) {
      const dashboard = await getFirstUserDashboardAction();

      if (dashboard.success && dashboard.data) {
        return dashboard.data;
      }
    }

    return null;
  };

  const isUserInvitedMember = async () => {
    if (session?.user?.email) {
      const userInvited = await isUserInvitedDashboardMemberAction();
      return userInvited.success && userInvited.data;
    }
    return false;
  };

  const dashboard = await getFirstDashboard();
  const userInvited = await isUserInvitedMember();

  const getStep = () => {
    /*if (session.user.onboardingCompletedAt || userInvited) {
      redirect('/dashboards');
    }*/

    if (!dashboard) {
      return 'website';
    }

    return 'integration';
  };

  const initialStep = getStep();

  const seoConfig = await buildSEOConfig(SEO_CONFIGS.onboarding);

  return (
    <>
      <StructuredData config={seoConfig} />
      <OnboardingProvider initialDashboard={dashboard}>
        <OnboardingPage initialStep={initialStep} />
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
