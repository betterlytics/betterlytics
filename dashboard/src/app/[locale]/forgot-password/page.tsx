import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('public.auth.forgotPassword');

  if (session) {
    redirect('/dashboards');
  }

  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{t('subtitle')}</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          <ForgotPasswordForm />
          <div className='mt-6 text-center'>
            <p className='text-muted-foreground text-sm'>
              {t('cta.remember')}{' '}
              <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
                {t('cta.backToSignIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
