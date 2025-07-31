'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useBARouter } from '@/hooks/use-ba-router';
import OtpInput from '@/components/ui/otp-input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { getProviders } from 'next-auth/react';

export default function LoginForm() {
  const router = useBARouter();
  const isMobile = useIsMobile();
  const totpInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [providers, setProviders] = useState<Record<string, any> | null>(null);

  const [isPending, startTransition] = useTransition();

  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isGithubPending, startGithubTransition] = useTransition();

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    totpInputRef.current?.focus();
  }, [totpInputRef, isPending]);

  const Error = () => {
    return (
      error && (
        <div
          className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
          role='alert'
        >
          <span className='block sm:inline'>{error}</span>
        </div>
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          totp,
          redirect: false,
          callbackUrl: '/dashboards',
        });

        if (result?.error) {
          if (result.error === 'missing_otp') {
            setIsDialogOpen(true);
          } else if (result.error == 'invalid_otp') {
            setTotp('');
            setError('Invalid verification code. Please check your credentials and try again.');
          } else {
            setError('Invalid email or password. Please check your credentials and try again.');
          }
        } else if (result?.url) {
          router.push(result.url);
        }
      } catch {
        setError('An error occurred during sign in. Please try again.');
      }
    });
  };

  const handleOAuthLogin = useCallback(async (oauthProvider: 'google' | 'github') => {
    setError('');

    const transition = oauthProvider === 'github' ? startGithubTransition : startGoogleTransition;

    transition(async () => {
      try {
        const result = await signIn(oauthProvider, {
          callbackUrl: '/dashboards',
        });

        if (result?.url) {
          router.push(result.url);
        }
      } catch {
        setError('An error occurred during sign in. Please try again.');
      }
    });
  }, []);

  return (
    <form id='login' className='space-y-6' onSubmit={handleSubmit}>
      {!isDialogOpen && <Error />}
      <div className='space-y-4'>
        <div>
          <label htmlFor='email' className='text-foreground mb-2 block text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='border-input bg-background text-foreground focus:ring-ring placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none'
            placeholder='Enter your email'
            disabled={isDialogOpen}
          />
        </div>
        <div>
          <label htmlFor='password' className='text-foreground mb-2 block text-sm font-medium'>
            Password
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='border-input bg-background text-foreground focus:ring-ring placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none'
            placeholder='Enter your password'
            disabled={isDialogOpen}
          />
        </div>
      </div>

      <div>
        <button
          type='submit'
          disabled={isPending || isDialogOpen}
          className='text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-ring flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isPending || isDialogOpen ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className='text-center'>
        <a href='/forgot-password' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
          Forgot your password?
        </a>
      </div>

      {providers?.google || providers?.github ? (
        <div className='relative my-6 flex items-center'>
          <div className='border-border flex-grow border-t'></div>
          <span className='text-muted-foreground mx-4 flex-shrink text-sm'>or</span>
          <div className='border-border flex-grow border-t'></div>
        </div>
      ) : null}

      <div className='space-y-3'>
        {/* Google Login Button */}
        {providers?.google && (
          <button
            type='button'
            onClick={() => handleOAuthLogin('google')}
            className='font-roboto transition-border relative box-border flex h-10 w-full max-w-[400px] min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border border-[#747775] bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-colors transition-shadow duration-200 ease-in-out outline-none select-none'
          >
            <svg width='40' height='40' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <g clipPath='url(#clip0_760_7199)'>
                <path
                  d='M31.6 20.2273C31.6 19.5182 31.5364 18.8364 31.4182 18.1818H22V22.05H27.3818C27.15 23.3 26.4455 24.3591 25.3864 25.0682V27.5773H28.6182C30.5091 25.8364 31.6 23.2727 31.6 20.2273V20.2273Z'
                  fill='#4285F4'
                />
                <path
                  d='M22 30C24.7 30 26.9636 29.1045 28.6181 27.5773L25.3863 25.0682C24.4909 25.6682 23.3454 26.0227 22 26.0227C19.3954 26.0227 17.1909 24.2636 16.4045 21.9H13.0636V24.4909C14.7091 27.7591 18.0909 30 22 30Z'
                  fill='#34A853'
                />
                <path
                  d='M16.4045 21.9C16.2045 21.3 16.0909 20.6591 16.0909 20C16.0909 19.3409 16.2045 18.7 16.4045 18.1V15.5091H13.0636C12.3864 16.8591 12 18.3864 12 20C12 21.6136 12.3864 23.1409 13.0636 24.4909L16.4045 21.9V21.9Z'
                  fill='#FBBC04'
                />
                <path
                  d='M22 13.9773C23.4681 13.9773 24.7863 14.4818 25.8227 15.4727L28.6909 12.6045C26.9591 10.9909 24.6954 10 22 10C18.0909 10 14.7091 12.2409 13.0636 15.5091L16.4045 18.1C17.1909 15.7364 19.3954 13.9773 22 13.9773Z'
                  fill='#E94235'
                />
              </g>

              <defs>
                <clipPath id='clip0_760_7199'>
                  <rect width='20' height='20' fill='white' transform='translate(12 10)' />
                </clipPath>
              </defs>
            </svg>

            <span className='font-roboto grow-0 truncate align-top font-medium'>
              {isGooglePending ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>
        )}

        {/* GitHub Login Button */}
        {providers?.github && (
          <button
            type='button'
            onClick={() => handleOAuthLogin('github')}
            className='font-roboto transition-border relative box-border flex h-10 w-full max-w-[400px] min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border border-[#747775] bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-colors transition-shadow duration-200 ease-in-out outline-none select-none'
          >
            {/* GitHub Octocat logo */}
            <svg width='40' height='22' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 0C5.37 0 0 5.38 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.263.82-.583 0-.287-.011-1.244-.017-2.444-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.746.083-.731.083-.731 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.419-1.305.762-1.605-2.665-.303-5.466-1.334-5.466-5.93 0-1.31.47-2.383 1.236-3.223-.124-.303-.536-1.523.117-3.176 0 0 1.01-.323 3.3 1.23.956-.266 1.98-.399 3-.405 1.02.006 2.044.139 3 .405 2.29-1.553 3.3-1.23 3.3-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.912 1.235 3.223 0 4.61-2.803 5.625-5.475 5.92.43.372.814 1.102.814 2.222 0 1.605-.015 2.898-.015 3.293 0 .322.216.697.825.578C20.565 21.796 24 17.297 24 12c0-6.62-5.38-12-12-12z' />
            </svg>

            <span className='font-roboto grow-0 truncate align-top font-medium'>
              {isGithubPending ? 'Signing in...' : 'Continue with GitHub'}
            </span>
          </button>
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className='max-h-[90vh] w-80 overflow-y-auto'>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-factor authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the verification code from your authenticator app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Error />
          {isPending ? (
            <Spinner className='m-auto' />
          ) : (
            <OtpInput
              value={totp}
              onValueChange={setTotp}
              disabled={isPending}
              ref={totpInputRef}
              autoSubmit
              form='login'
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
