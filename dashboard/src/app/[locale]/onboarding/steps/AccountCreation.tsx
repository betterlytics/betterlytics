'use client';

import { useState, useTransition, useCallback, Dispatch } from 'react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerUserAction } from '@/app/actions';
import { RegisterUserSchema } from '@/entities/user';
import { signIn, getProviders } from 'next-auth/react';
import { ZodError } from 'zod';
import { GoogleIcon, GitHubIcon } from '@/components/icons';
import Logo from '@/components/logo';
import { CheckCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5, // controls delay *between* li's
      delayChildren: 0.4, // initial delay before starting the whole batch
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

type AccountCreationProps = {
  providers: Awaited<ReturnType<typeof getProviders>>;
  onNext: Dispatch<void>;
};

export default function AccountCreation({ providers, onNext }: AccountCreationProps) {
  const { state, setUserId } = useOnboarding();
  const t = useTranslations('onboarding.account');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isGithubPending, startGithubTransition] = useTransition();

  const handleEmailRegistration = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      const name = formData.get('name') as string | null;

      if (password !== confirmPassword) {
        setError(t('form.passwordsDoNotMatch'));
        return;
      }

      try {
        const validatedData = RegisterUserSchema.parse({
          email,
          password,
          name: name?.trim() || undefined,
        });

        startTransition(async () => {
          const result = await registerUserAction(validatedData);

          if (!result.success) {
            setError(result.error.message);
            return;
          }

          const signInResult = await signIn('credentials', {
            email: validatedData.email,
            password: validatedData.password,
            redirect: false,
          });

          if (signInResult?.error) {
            setError(t('form.registrationSuccessfulButSignInFailed'));
            return;
          }

          setUserId(result.data.id);

          onNext();
        });
      } catch (error) {
        if (error instanceof ZodError) {
          setError(error.errors[0]?.message || t('form.checkInput'));
        } else {
          console.log(error);
          setError(t('form.checkInput'));
        }
      }
    },
    [setUserId],
  );

  const handleOAuthRegistration = useCallback(async (provider: 'google' | 'github') => {
    setError('');
    const transition = provider === 'github' ? startGithubTransition : startGoogleTransition;

    transition(async () => {
      try {
        const result = await signIn(provider, {
          redirect: false,
          callbackUrl: '/onboarding',
        });

        if (result?.url) {
          window.location.href = result.url;
        }
      } catch {
        setError(t('form.signUpError'));
      }
    });
  }, []);

  return (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-[1fr_1.02fr]'>
      <div className='hidden space-y-10 px-6 py-10 md:block'>
        <motion.ul variants={listVariants} initial='hidden' animate='visible' className='space-y-8'>
          <motion.li className='grid grid-cols-10 gap-y-2' variants={itemVariants}>
            <CheckCircleIcon color='var(--primary)' />
            <h3 className='col-span-9 font-semibold'>{t('features.feature1.title')}</h3>
            <p className='text-muted-foreground col-span-9 col-start-2 text-sm'>
              {t('features.feature1.description')}
            </p>
          </motion.li>
          <motion.li className='grid grid-cols-10 gap-y-2' variants={itemVariants}>
            <CheckCircleIcon color='var(--primary)' />
            <h3 className='col-span-9 font-semibold'>{t('features.feature2.title')}</h3>
            <p className='text-muted-foreground col-span-9 col-start-2 text-sm'>
              {t('features.feature2.description')}
            </p>
          </motion.li>
          <motion.li className='grid grid-cols-10 gap-y-2' variants={itemVariants}>
            <CheckCircleIcon color='var(--primary)' />
            <h3 className='col-span-9 font-semibold'>{t('features.feature3.title')}</h3>
            <p className='text-muted-foreground col-span-9 col-start-2 text-sm'>
              {t('features.feature3.description')}
            </p>
          </motion.li>
        </motion.ul>
      </div>
      <div className='bg-card col-span-2 space-y-3 rounded-lg border p-6 shadow-sm md:col-span-1'>
        <h2 className='text-center text-2xl font-semibold'>{t('form.title')}</h2>
        {error && (
          <div
            className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
            role='alert'
          >
            <span className='block sm:inline'>{error}</span>
          </div>
        )}
        {(providers?.google || providers?.github) && (
          <p className='text-muted-foreground mt-2 text-center text-sm'>{t('form.signUpWith')}</p>
        )}
        <div className='flex gap-3'>
          {/* Google Registration Button */}
          {providers?.google && (
            <button
              type='button'
              onClick={() => handleOAuthRegistration('google')}
              disabled={isGooglePending}
              className='font-roboto transition-border relative box-border flex h-10 w-full min-w-min cursor-pointer appearance-none items-center justify-center rounded-xl border border-[#747775] bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-all duration-200 ease-in-out outline-none select-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <GoogleIcon />

              <span className='font-roboto grow-0 truncate align-top font-medium'>
                {isGooglePending ? t('form.signingUpGoogle') : t('form.googleButton')}
              </span>
            </button>
          )}

          {/* GitHub Registration Button */}
          {providers?.github && (
            <button
              type='button'
              onClick={() => handleOAuthRegistration('github')}
              disabled={isGithubPending}
              className='font-roboto transition-border relative box-border flex h-10 w-full min-w-min cursor-pointer appearance-none items-center justify-center rounded-xl border border-[#747775] bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-all duration-200 ease-in-out outline-none select-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <GitHubIcon />

              <span className='font-roboto grow-0 truncate align-top font-medium'>
                {isGithubPending ? t('form.signingUpGitHub') : t('form.gitHubButton')}
              </span>
            </button>
          )}
        </div>

        <div>
          <span className='text-muted-foreground text-xs font-medium'>
            {t.rich('form.termsAgreement', {
              termsLink: (chunks) => (
                <Link href='/privacy' target='__blank' className='underline'>
                  {chunks}
                </Link>
              ),
              privacyLink: (chunks) => (
                <Link href='/terms' target='__blank' className='underline'>
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </div>

        {(providers?.google || providers?.github) && (
          <div className='relative my-4 flex items-center'>
            <div className='border-border flex-grow border-t'></div>
            <span className='text-muted-foreground mx-4 flex-shrink text-sm'>{t('form.orDivider')}</span>
            <div className='border-border flex-grow border-t'></div>
          </div>
        )}
        <form className='space-y-4' onSubmit={handleEmailRegistration}>
          <div className='space-y-2'>
            <Label htmlFor='email'>{t('form.emailLabel')}</Label>
            <Input
              id='email'
              name='email'
              type='email'
              required
              defaultValue={state.account.email || ''}
              placeholder={t('form.emailPlaceholder')}
              className='h-10 rounded-xl'
              disabled={isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>{t('form.passwordLabel')}</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              placeholder={t('form.passwordPlaceholder')}
              className='h-10 rounded-xl'
              disabled={isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>{t('form.confirmPasswordLabel')}</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              required
              placeholder={t('form.confirmPasswordPlaceholder')}
              className='h-10 rounded-xl'
              disabled={isPending}
            />
          </div>

          <Button
            type='submit'
            disabled={isPending}
            className='shadow-primary/50 h-10 w-full rounded-xl shadow-2xl'
          >
            {isPending ? t('form.creatingAccount') : t('form.continueButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}
