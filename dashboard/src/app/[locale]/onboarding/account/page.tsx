'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
import { Link, useRouter } from '@/i18n/navigation';

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

export default function AccountCreationPage() {
  const { state, setUserId } = useOnboarding();
  const { data: session } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isGithubPending, startGithubTransition] = useTransition();

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  // If user already has a session (OAuth users), automatically proceed to next step
  useEffect(() => {
    if (session?.user) {
      router.push('/onboarding/website');
    }
  }, [session, router]);

  const handleEmailRegistration = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      const name = formData.get('name') as string | null;
      console.log('Name:', name);
      if (password !== confirmPassword) {
        setError('Passwords do not match');
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
            setError('Registration successful, but sign in failed. Please try signing in manually.');
            return;
          }

          setUserId(result.data.id);
          router.push('/onboarding/website');
        });
      } catch (error) {
        if (error instanceof ZodError) {
          setError(error.errors[0]?.message || 'Please check your input');
        } else {
          console.log(error);
          setError('Please check your input');
        }
      }
    },
    [setUserId, router],
  );

  const handleOAuthRegistration = useCallback(async (provider: 'google' | 'github') => {
    setError('');
    const transition = provider === 'github' ? startGithubTransition : startGoogleTransition;

    transition(async () => {
      try {
        const result = await signIn(provider, {
          redirect: false,
          callbackUrl: '/onboarding/account',
        });

        if (result?.url) {
          window.location.href = result.url;
        }
      } catch {
        setError('An error occurred during sign up. Please try again.');
      }
    });
  }, []);

  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='hidden space-y-10 px-6 py-10 md:block'>
        <div className='flex justify-center'>
          <Logo variant='icon' showText textSize='md' priority />
        </div>
        <motion.ul variants={listVariants} initial='hidden' animate='visible' className='space-y-8'>
          <motion.li className='grid grid-cols-10 gap-y-2' variants={itemVariants}>
            <CheckCircleIcon color='var(--primary)' />
            <h3 className='col-span-9 font-semibold'>Start collecting web analytics immediately</h3>
            <p className='text-muted-foreground col-span-9 col-start-2 text-sm'>
              Integrate our low-code web snippet into your site, or use our npm package.
            </p>
          </motion.li>
          <motion.li className='grid grid-cols-10 gap-y-2' variants={itemVariants}>
            <CheckCircleIcon color='var(--primary)' />
            <h3 className='col-span-9 font-semibold'>Generous free plan to help you grow</h3>
            <p className='text-muted-foreground col-span-9 col-start-2 text-sm'>
              10K events every month for free, no creditcard required, no strings attached. Forever.
            </p>
          </motion.li>
          <motion.li className='grid grid-cols-10 gap-y-2' variants={itemVariants}>
            <CheckCircleIcon color='var(--primary)' />
            <h3 className='col-span-9 font-semibold'>Awesome features on their way</h3>
            <p className='text-muted-foreground col-span-9 col-start-2 text-sm'>
              Betterlytics is open-source. We're actively working on new features we're eager to show
            </p>
          </motion.li>
        </motion.ul>
      </div>
      <div className='bg-card col-span-2 space-y-3 rounded-lg border p-6 shadow-sm md:col-span-1'>
        <h2 className='text-center text-2xl font-semibold'>Create your account</h2>
        {error && (
          <div
            className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
            role='alert'
          >
            <span className='block sm:inline'>{error}</span>
          </div>
        )}
        {(providers?.google || providers?.github) && (
          <p className='text-muted-foreground mt-2 text-center text-sm'>Sign up with</p>
        )}
        <div className='flex gap-3'>
          {/* Google Registration Button */}
          {providers?.google && (
            <button
              type='button'
              onClick={() => handleOAuthRegistration('google')}
              disabled={isGooglePending}
              className='font-roboto transition-border relative box-border flex h-9 w-full min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border border-[#747775] bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-colors transition-shadow duration-200 ease-in-out outline-none select-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <GoogleIcon />

              <span className='font-roboto grow-0 truncate align-top font-medium'>
                {isGooglePending ? 'Signing up...' : 'Google'}
              </span>
            </button>
          )}

          {/* GitHub Registration Button */}
          {providers?.github && (
            <button
              type='button'
              onClick={() => handleOAuthRegistration('github')}
              disabled={isGithubPending}
              className='font-roboto transition-border relative box-border flex h-9 w-full min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border border-[#747775] bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-colors transition-shadow duration-200 ease-in-out outline-none select-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <GitHubIcon />

              <span className='font-roboto grow-0 truncate align-top font-medium'>
                {isGithubPending ? 'Signing up...' : 'GitHub'}
              </span>
            </button>
          )}
        </div>

        <div>
          <span className='text-sm font-light'>
            By continuing, you agree to our{' '}
            <Link href='/privacy' target='__blank' className='underline'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/terms' target='__blank' className='underline'>
              Privacy Policy
            </Link>
            .
          </span>
        </div>

        {(providers?.google || providers?.github) && (
          <div className='relative my-4 flex items-center'>
            <div className='border-border flex-grow border-t'></div>
            <span className='text-muted-foreground mx-4 flex-shrink text-sm'>or</span>
            <div className='border-border flex-grow border-t'></div>
          </div>
        )}
        <form className='space-y-4' onSubmit={handleEmailRegistration}>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              required
              defaultValue={state.account.email || ''}
              placeholder='Enter your email'
              disabled={isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              placeholder='Enter your password (min. 8 characters)'
              disabled={isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              required
              placeholder='Confirm your password'
              disabled={isPending}
            />
          </div>

          <Button type='submit' disabled={isPending} className='w-full'>
            {isPending ? 'Creating account...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
