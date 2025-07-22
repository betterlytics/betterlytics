'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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

      <div className='text-center'>
        <a href='/forgot-password' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
          Forgot your password?
        </a>
      </div>
    </form>
  );
}
