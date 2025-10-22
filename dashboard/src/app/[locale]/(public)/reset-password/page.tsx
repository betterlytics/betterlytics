import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import type { SupportedLanguages } from '@/constants/i18n';
import { authOptions } from '@/lib/auth';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import { Link } from '@/i18n/navigation';
import { validateResetTokenAction } from '@/app/actions/passwordReset';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.auth.resetPassword.seo' });
  return {
    ...generateSEO(
      {
        title: t('title'),
        description: t('description'),
        keywords: t.raw('keywords') as string[],
        path: '/reset-password',
      },
      { locale },
    ),
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
  };
}

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

interface ResetPasswordLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ResetPasswordLayout({ title, description, children }: ResetPasswordLayoutProps) {
  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>{title}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{description}</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>{children}</div>
      </div>
    </div>
  );
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('public.auth.resetPassword');

  if (session) {
    redirect('/dashboards');
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetPasswordLayout title={t('invalid.title')} description={t('invalid.description')}>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>{t('invalid.note')}</p>
          <Link href='/forgot-password' className='text-primary hover:text-primary/80 font-medium underline'>
            {t('invalid.requestLink')}
          </Link>
        </div>
      </ResetPasswordLayout>
    );
  }

  const isValidToken = await validateResetTokenAction(token);

  if (!isValidToken) {
    return (
      <ResetPasswordLayout title={t('expired.title')} description={t('expired.description')}>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>{t('expired.info')}</p>
          <Link href='/forgot-password' className='text-primary hover:text-primary/80 font-medium underline'>
            {t('expired.requestLink')}
          </Link>
        </div>
      </ResetPasswordLayout>
    );
  }

  return (
    <ResetPasswordLayout title={t('form.title')} description={t('form.description')}>
      <ResetPasswordForm token={token} />
      <div className='mt-6 text-center'>
        <p className='text-muted-foreground text-sm'>
          {t('cta.remember')}{' '}
          <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
            {t('cta.backToSignIn')}
          </Link>
        </p>
      </div>
    </ResetPasswordLayout>
  );
}
