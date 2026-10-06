import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import type { SupportedLanguages } from '@/constants/i18n';
import { getSignupAllowance } from '@/services/auth/signupGate.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { isOpenInvitation } from '@/entities/dashboard/invitation.entities';
import { getTranslations } from 'next-intl/server';
import { StructuredData } from '@/components/StructuredData';
import { getAuthSession } from '@/auth/auth-actions';
import { getEnabledOAuthProviders } from '@/lib/better-auth';
import SignupForm from './SignupForm';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signup);
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

type SignupPageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await getAuthSession();
  const t = await getTranslations('public.auth.register');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signup);
  const { invite } = await searchParams;

  const invitation = invite ? await findInvitationByToken(invite) : null;
  const openInvitation = invitation && isOpenInvitation(invitation) ? invitation : null;
  const acceptPath = openInvitation ? `/accept-invite/${invite}` : undefined;

  if (session) {
    redirect(acceptPath ?? '/dashboards');
  }

  if (
    !(await getSignupAllowance({ email: openInvitation?.email, inviteToken: openInvitation ? invite : undefined }))
  ) {
    return (
      <>
        <StructuredData config={seoConfig} />
        <div className='bg-background flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
          <div className='w-full max-w-md space-y-8'>
            <div className='text-center'>
              <div className='mb-10 flex justify-center'>
                <Logo variant='simple' showText textSize='lg' priority />
              </div>
              <h2 className='text-foreground text-2xl font-semibold'>{t('disabled.title')}</h2>
              <p className='text-muted-foreground mt-3 text-sm'>{t('disabled.description')}</p>
              <div className='mt-6'>
                <Link href='/signin' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
                  {t('disabled.backToSignIn')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const providers = getEnabledOAuthProviders();

  return (
    <>
      <StructuredData config={seoConfig} />
      <SignupForm
        providers={providers}
        invitedEmail={openInvitation?.email}
        invitedDomain={openInvitation?.dashboard?.domain}
        inviteToken={openInvitation ? invite : undefined}
        redirectTo={acceptPath}
        requireTerms={isFeatureEnabled('isCloud')}
      />
    </>
  );
}
