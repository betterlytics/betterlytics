'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { authClient } from '@/lib/auth-client';
import type { getEnabledOAuthProviders } from '@/lib/better-auth';
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
import ExternalLink from '@/components/ExternalLink';
import { GoogleIcon, GitHubIcon } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginFormProps = {
  registrationDisabledMessage?: string | null;
  forgotPasswordEnabled?: boolean;
  providers: ReturnType<typeof getEnabledOAuthProviders>;
};

export default function LoginForm({
  registrationDisabledMessage,
  forgotPasswordEnabled,
  providers,
}: LoginFormProps) {
  const router = useBARouter();
  const isMobile = useIsMobile();
  const t = useTranslations('public.auth.signin.form');
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
    if (!registrationDisabledMessage) return;
    toast.warning(registrationDisabledMessage, { duration: 6000 });
  }, [registrationDisabledMessage]);

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
        // Second submit (from the dialog): verify the TOTP code for the pending sign-in.
        if (isDialogOpen) {
          const { error: totpError } = await authClient.twoFactor.verifyTotp({ code: totp });
          if (totpError) {
            setTotp('');
            setError(t('errors.invalidOtp'));
            return;
          }
          router.push('/dashboards');
          return;
        }

        const { data, error: signInError } = await authClient.signIn.email({ email, password });
        if (signInError) {
          setError(t('errors.invalidCredentials'));
          return;
        }
        if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
          setIsDialogOpen(true);
          return;
        }
        router.push('/dashboards');
      } catch {
        setError(t('errors.generic'));
      }
    });
  };

  const handleOAuthLogin = useCallback(
    async (oauthProvider: 'google' | 'github') => {
      setError('');

      const transition = oauthProvider === 'github' ? startGithubTransition : startGoogleTransition;

      transition(async () => {
        try {
          // Navigates the browser to the provider's consent screen. Callback
          // failures come back to /signin?error=<code> instead of better-auth's
          // unbranded /api/auth/error page.
          const { error: socialError } = await authClient.signIn.social({
            provider: oauthProvider,
            callbackURL: '/dashboards',
            newUserCallbackURL: '/onboarding?newUser=true',
            errorCallbackURL: '/signin',
          });
          if (socialError) {
            setError(t('errors.generic'));
          }
        } catch {
          setError(t('errors.generic'));
        }
      });
    },
    [t],
  );

  return (
    <form id='login' className='space-y-6' onSubmit={handleSubmit}>
      {!isDialogOpen && <Error />}
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>{t('emailLabel')}</Label>
          <Input
            id='email'
            name='email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className='h-10 rounded-md text-sm'
            disabled={isDialogOpen}
            tabIndex={1}
          />
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='password'>{t('passwordLabel')}</Label>
            {forgotPasswordEnabled && (
              <ExternalLink
                href='/forgot-password'
                className='text-primary hover:text-primary/80 text-sm font-medium underline'
                tabIndex={2}
              >
                {t('forgotPassword')}
              </ExternalLink>
            )}
          </div>
          <Input
            id='password'
            name='password'
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            className='h-10 rounded-md text-sm'
            disabled={isDialogOpen}
            tabIndex={1}
          />
        </div>
      </div>

      <div>
        <Button
          type='submit'
          tabIndex={1}
          disabled={isPending || isDialogOpen}
          className='shadow-primary/50 shadow-2x h-10 w-full cursor-pointer rounded-md'
        >
          {isPending || isDialogOpen ? t('submitting') : t('submitButton')}
        </Button>
      </div>

      {providers.google || providers.github ? (
        <div className='relative my-6 flex items-center'>
          <div className='border-border flex-grow border-t'></div>
          <span className='text-muted-foreground mx-4 flex-shrink text-sm'>{t('orDivider')}</span>
          <div className='border-border flex-grow border-t'></div>
        </div>
      ) : null}

      <div className='space-y-3'>
        {providers.google && (
          <button
            type='button'
            tabIndex={1}
            onClick={() => handleOAuthLogin('google')}
            className='font-roboto transition-border focus:ring-ring relative box-border flex h-10 w-full max-w-[400px] min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-colors transition-shadow duration-200 ease-in-out outline-none select-none focus:border-transparent focus:ring-2 focus:outline-none'
          >
            <GoogleIcon />

            <span className='font-roboto grow-0 truncate align-top font-medium'>
              {isGooglePending ? t('submitting') : t('continueWithGoogle')}
            </span>
          </button>
        )}

        {providers.github && (
          <button
            type='button'
            tabIndex={1}
            onClick={() => handleOAuthLogin('github')}
            className='font-roboto transition-border focus:ring-ring relative box-border flex h-10 w-full max-w-[400px] min-w-min cursor-pointer appearance-none items-center justify-center rounded-md border bg-white bg-none px-3 text-center align-middle text-sm tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-colors transition-shadow duration-200 ease-in-out outline-none select-none focus:border-transparent focus:ring-2 focus:outline-none'
          >
            <GitHubIcon />

            <span className='font-roboto grow-0 truncate align-top font-medium'>
              {isGithubPending ? t('submitting') : t('continueWithGithub')}
            </span>
          </button>
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className='max-h-[90vh] w-80 overflow-y-auto'>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('twoFactor.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('twoFactor.description')}</AlertDialogDescription>
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
            <AlertDialogCancel disabled={isPending}>{t('twoFactor.cancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
