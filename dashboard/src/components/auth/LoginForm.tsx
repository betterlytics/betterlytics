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
import { cn } from '@/lib/utils';

// Backup codes are `xxxxx-xxxxx` over [A-Za-z0-9]; the hyphen brings the total to 11.
const BACKUP_CODE_LENGTH = 11;

/**
 * Normalises whatever the user typed or pasted into `xxxxx-xxxxx`, dropping characters that cannot
 * appear in a code and re-inserting the separator. Case is preserved deliberately: codes are mixed
 * case and compared exactly, so re-casing here would reject valid codes.
 */
function formatBackupCode(value: string) {
  const chars = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
  return chars.length > 5 ? `${chars.slice(0, 5)}-${chars.slice(5)}` : chars;
}

function FormError({ message, className }: { message: string; className?: string }) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3',
        className,
      )}
      role='alert'
    >
      <span className='block sm:inline'>{message}</span>
    </div>
  );
}

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
  const backupCodeInputRef = useRef<HTMLInputElement>(null);
  const autoSubmittedCodeRef = useRef('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
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

  // Keep a rejected code on screen but selected, so retrying overwrites it instead of forcing a retype.
  useEffect(() => {
    if (isPending || !useBackupCode || !error) return;

    backupCodeInputRef.current?.select();
  }, [isPending, useBackupCode, error]);

  // AutoSubmit once a full code is entered
  useEffect(() => {
    if (isPending || !useBackupCode || backupCode.length < BACKUP_CODE_LENGTH) return;
    if (autoSubmittedCodeRef.current === backupCode) return;

    autoSubmittedCodeRef.current = backupCode;
    backupCodeInputRef.current?.form?.requestSubmit();
  }, [isPending, useBackupCode, backupCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        if (isDialogOpen) {
          const { error: verifyError } = useBackupCode
            ? await authClient.twoFactor.verifyBackupCode({ code: backupCode })
            : await authClient.twoFactor.verifyTotp({ code: totp });
          if (verifyError) {
            setTotp('');
            setError(t(useBackupCode ? 'errors.invalidBackupCode' : 'errors.invalidOtp'));
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
          // Navigates the browser to the provider's consent screen. errorCallbackURL
          // keeps failures off better-auth's unbranded /api/auth/error page.
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
      {!isDialogOpen && <FormError message={error} />}
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

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUseBackupCode(false);
            setBackupCode('');
            autoSubmittedCodeRef.current = '';
          }
          setIsDialogOpen(open);
        }}
      >
        <AlertDialogContent className='max-h-[90vh] w-80 overflow-y-auto'>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('twoFactor.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(useBackupCode ? 'twoFactor.backupCodeDescription' : 'twoFactor.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormError message={error} className='text-sm' />
          {isPending ? (
            <Spinner className='m-auto' />
          ) : useBackupCode ? (
            <Input
              ref={backupCodeInputRef}
              value={backupCode}
              onChange={(e) => setBackupCode(formatBackupCode(e.target.value))}
              placeholder='xxxxx-xxxxx'
              autoComplete='off'
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              maxLength={BACKUP_CODE_LENGTH}
              autoFocus
              form='login'
              className='text-center font-mono'
            />
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
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={isPending}
            onClick={() => {
              setError('');
              setTotp('');
              setBackupCode('');
              autoSubmittedCodeRef.current = '';
              setUseBackupCode((v) => !v);
            }}
            className='text-muted-foreground hover:text-foreground w-full cursor-pointer font-normal'
          >
            {t(useBackupCode ? 'twoFactor.useAuthenticator' : 'twoFactor.useBackupCode')}
          </Button>
          <AlertDialogFooter className='sm:flex-col-reverse sm:justify-normal'>
            <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
              {t('twoFactor.cancel')}
            </AlertDialogCancel>
            {useBackupCode && (
              <Button
                type='submit'
                form='login'
                disabled={isPending || backupCode.length < BACKUP_CODE_LENGTH}
                className='cursor-pointer'
              >
                {t('twoFactor.verify')}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
