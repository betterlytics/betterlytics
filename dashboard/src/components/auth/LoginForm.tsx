'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

export default function LoginForm() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const totpInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isGithubPending, startGithubTransition] = useTransition();

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

      <div className='relative my-6 flex items-center'>
        <div className='border-border flex-grow border-t'></div>
        <span className='text-muted-foreground mx-4 flex-shrink text-sm'>or</span>
        <div className='border-border flex-grow border-t'></div>
      </div>

      <div className='space-y-3'>
        {/* Google Login Button */}
        <button
          type='button'
          onClick={() => handleOAuthLogin('google')}
          className='flex w-full cursor-pointer items-center justify-center gap-3 border border-gray-400 bg-transparent px-6 py-2 text-sm font-medium text-white focus:ring-2 focus:ring-gray-500 focus:outline-none'
        >
          {/* Google G logo */}
          <img width='24' height='24' src='https://img.icons8.com/fluency/48/google-logo.png' alt='google-logo' />

          {isGooglePending ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* GitHub Login Button */}
        <button
          type='button'
          onClick={() => handleOAuthLogin('github')}
          className='flex w-full cursor-pointer items-center justify-center gap-3 border border-gray-400 bg-transparent px-6 py-2 text-sm font-medium text-white focus:ring-2 focus:ring-gray-500 focus:outline-none'
        >
          {/* GitHub Octocat logo */}
          <svg className='h-5 w-5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 0C5.37 0 0 5.38 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.263.82-.583 0-.287-.011-1.244-.017-2.444-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.746.083-.731.083-.731 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.419-1.305.762-1.605-2.665-.303-5.466-1.334-5.466-5.93 0-1.31.47-2.383 1.236-3.223-.124-.303-.536-1.523.117-3.176 0 0 1.01-.323 3.3 1.23.956-.266 1.98-.399 3-.405 1.02.006 2.044.139 3 .405 2.29-1.553 3.3-1.23 3.3-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.912 1.235 3.223 0 4.61-2.803 5.625-5.475 5.92.43.372.814 1.102.814 2.222 0 1.605-.015 2.898-.015 3.293 0 .322.216.697.825.578C20.565 21.796 24 17.297 24 12c0-6.62-5.38-12-12-12z' />
          </svg>
          {isGithubPending ? 'Signing in...' : 'Continue with GitHub'}
        </button>
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
