'use client';

import { useState, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { isUserInvitedDashboardMemberAction, registerUserAction } from '@/app/actions/index.actions';
import { RegisterUserSchema } from '@/entities/auth/user.entities';
import { signIn, getProviders } from 'next-auth/react';
import { ZodError } from 'zod';
import { GoogleIcon, GitHubIcon } from '@/components/icons';
import { CheckCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SupportedLanguages } from '@/constants/i18n';
import { baEvent } from '@/lib/ba-event';
import { useBARouter } from '@/hooks/use-ba-router';
import { acceptPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import Logo from '@/components/logo';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

type SignupFormProps = {
  providers: Awaited<ReturnType<typeof getProviders>>;
};

export default function SignupForm({ providers }: SignupFormProps) {
  const t = useTranslations('onboarding.account');
  const tValidation = useTranslations('validation');
  const tAuth = useTranslations('public.auth.register');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isGithubPending, startGithubTransition] = useTransition();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const router = useBARouter();

  const handlePotentialInvitationsOnAccountCreation = useCallback(async () => {
    try {
      const acceptedInvitations = await acceptPendingInvitationsAction();
      const isUserDashboardMember = await isUserInvitedDashboardMemberAction();
      if (
        (acceptedInvitations.success && acceptedInvitations.data.length > 0) ||
        (isUserDashboardMember.success && isUserDashboardMember.data)
      ) {
        router.push('/dashboards');
        return {
          hadInvitations: true,
        };
      }
    } catch {}
    return {
      hadInvitations: false,
    };
  }, [router]);

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
        if (!acceptedTerms) {
          setError(tValidation('termsOfServiceRequired'));
          return;
        }
        const validatedData = RegisterUserSchema.parse({
          email,
          password,
          name: name?.trim() || undefined,
          acceptedTerms,
          language: locale as SupportedLanguages,
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

          baEvent('onboarding-account-created');

          const { hadInvitations } = await handlePotentialInvitationsOnAccountCreation();

          if (hadInvitations) {
            return;
          }

          // Redirect to onboarding flow for website setup
          router.push('/onboarding');
        });
      } catch (error) {
        if (error instanceof ZodError) {
          const message = error.errors[0]?.message;
          if (message === 'onboarding.account.termsOfServiceRequired') {
            setError(tValidation('termsOfServiceRequired'));
          } else {
            setError(message || t('form.checkInput'));
          }
        } else {
          console.log(error);
          setError(t('form.checkInput'));
        }
      }
    },
    [acceptedTerms, t, tValidation, locale, router, startTransition, handlePotentialInvitationsOnAccountCreation],
  );

  const handleOAuthRegistration = useCallback(
    async (provider: 'google' | 'github') => {
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
    },
    [t, startGithubTransition, startGoogleTransition],
  );

  return (
    <main className='relative flex w-full flex-1 flex-col items-center justify-center gap-2 py-8'>
      <div className='container mx-auto max-w-4xl px-4'>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-[1fr_1.02fr]'>
          <div className='hidden space-y-10 px-6 py-10 md:block'>
            <div className='flex justify-center pr-3'>
              <Link href='/' className='mb-8 flex items-center space-x-2'>
                <Logo variant='simple' showText textSize='lg' priority />
              </Link>
            </div>
            <motion.ul variants={listVariants} initial='hidden' animate='visible' className='space-y-8'>
              <motion.li className='flex gap-3' variants={itemVariants}>
                <CheckCircleIcon color='var(--primary)' className='mt-0.5 h-5 w-5 shrink-0' />
                <div>
                  <h3 className='font-semibold'>{t('features.feature1.title')}</h3>
                  <p className='text-muted-foreground text-sm'>{t('features.feature1.description')}</p>
                </div>
              </motion.li>
              <motion.li className='flex gap-3' variants={itemVariants}>
                <CheckCircleIcon color='var(--primary)' className='mt-0.5 h-5 w-5 shrink-0' />
                <div>
                  <h3 className='font-semibold'>{t('features.feature2.title')}</h3>
                  <p className='text-muted-foreground text-sm'>{t('features.feature2.description')}</p>
                </div>
              </motion.li>
              <motion.li className='flex gap-3' variants={itemVariants}>
                <CheckCircleIcon color='var(--primary)' className='mt-0.5 h-5 w-5 shrink-0' />
                <div>
                  <h3 className='font-semibold'>{t('features.feature3.title')}</h3>
                  <p className='text-muted-foreground text-sm'>{t('features.feature3.description')}</p>
                </div>
              </motion.li>
            </motion.ul>
          </div>
          <div className='bg-card col-span-2 space-y-3 rounded-lg border p-3 py-4 pb-5 shadow-sm sm:p-6 md:col-span-1'>
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
                  className='font-roboto transition-border relative box-border flex h-10 w-full min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-all duration-200 ease-in-out outline-none select-none disabled:cursor-not-allowed disabled:opacity-50'
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
                  className='font-roboto transition-border relative box-border flex h-10 w-full min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-all duration-200 ease-in-out outline-none select-none disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <GitHubIcon />

                  <span className='font-roboto grow-0 truncate align-top font-medium'>
                    {isGithubPending ? t('form.signingUpGitHub') : t('form.gitHubButton')}
                  </span>
                </button>
              )}
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
                  placeholder={t('form.emailPlaceholder')}
                  className='h-10 rounded-md'
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
                  className='h-10 rounded-md'
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
                  className='h-10 rounded-md'
                  disabled={isPending}
                />
              </div>

              <div className='mt-6 mb-1 flex items-start gap-2'>
                <Checkbox
                  id='agree-terms-register'
                  checked={acceptedTerms}
                  onCheckedChange={(v) => {
                    const accepted = v === true;
                    setAcceptedTerms(accepted);
                    if (accepted) setError('');
                  }}
                  aria-required={true}
                />
                <Label
                  htmlFor='agree-terms-register'
                  className='text-muted-foreground text-xs leading-snug font-normal'
                >
                  <span>
                    {t.rich('form.termsAgreeLabel', {
                      termsLink: (chunks) => (
                        <Link href='/terms' target='__blank' rel='noopener noreferrer' className='underline'>
                          {chunks}
                        </Link>
                      ),
                      privacyLink: (chunks) => (
                        <Link href='/privacy' target='__blank' rel='noopener noreferrer' className='underline'>
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </Label>
              </div>

              {acceptedTerms ? (
                <Button
                  type='submit'
                  disabled={isPending}
                  className='shadow-primary/50 shadow-2x mt-3 h-10 w-full cursor-pointer rounded-md'
                >
                  {isPending ? t('form.creatingAccount') : t('form.continueButton')}
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className='block w-full'>
                        <Button
                          type='submit'
                          disabled
                          aria-disabled='true'
                          className='shadow-primary/50 shadow-2x mt-3 h-10 w-full cursor-pointer rounded-md'
                        >
                          {t('form.continueButton')}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side='top'>{tValidation('termsOfServiceRequired')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </form>
          </div>
          <div className='col-span-2 mt-2 text-center md:col-span-1 md:col-start-2'>
            <p className='text-muted-foreground text-sm'>
              {tAuth('cta.haveAccount')}{' '}
              <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
                {tAuth('cta.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
