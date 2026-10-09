'use client';

import { Fragment, useEffect, useId, useRef, useState } from 'react';
import * as OTP from '@radix-ui/react-one-time-password-field';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { inviteTokenFromCallback, signInPath, twoFactorAttemptEnded } from '@/lib/auth/auth-page-state';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import {
  Alert,
  AuthForm,
  describedBy,
  EmailInput,
  Field,
  isEmailAddress,
  OAuthCells,
  PasswordInput,
  SubmitButton,
  type OAuthProvider,
  type Providers,
} from './fields';
import { ArrowLeftIcon, ShieldIcon } from './icons';
import styles from './authForm.module.css';

const OTP_LENGTH = 6;
// Backup codes are `xxxxx-xxxxx`: ten characters plus the hyphen.
const BACKUP_CODE_LENGTH = 11;

/** Case is kept: backup codes are mixed case and compared exactly. */
function formatBackupCode(value: string) {
  const chars = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
  return chars.length > 5 ? `${chars.slice(0, 5)}-${chars.slice(5)}` : chars;
}

type SignInFormProps = {
  providers: Providers;
  forgotPassword: boolean;
  redirectTo: string;
  initialError: string | null;
  notice: string | null;
};

export function SignInForm({ providers, forgotPassword, redirectTo, initialError, notice }: SignInFormProps) {
  const t = useTranslations('public.auth.signin');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'twoFactor'>('credentials');
  const [error, setError] = useState<string | null>(initialError);
  const [invalid, setInvalid] = useState<'email' | 'password' | 'both' | null>(null);
  const [pending, setPending] = useState<'email' | OAuthProvider | null>(null);
  // bumped to refocus a field once the credentials form is back on screen
  const [refocus, setRefocus] = useState<{ count: number; field: 'email' | 'password' }>({
    count: 0,
    field: 'password',
  });
  const ids = { error: `${id}-error`, email: `${id}-email`, password: `${id}-password` };

  useEffect(() => {
    if (!refocus.count) return;
    const field = refocus.field === 'email' ? emailRef.current : passwordRef.current;
    field?.focus();
    field?.select();
  }, [refocus]);

  const fail = (message: string, about: 'email' | 'password' | 'both' | null = null) => {
    setPending(null);
    setInvalid(about);
    setError(message);
    setRefocus(({ count }) => ({ count: count + 1, field: about === 'email' ? 'email' : 'password' }));
  };

  const signInWithEmail = async () => {
    if (pending) return;
    if (!email.trim()) return fail(tFields('errors.emailRequired'), 'email');
    if (!isEmailAddress(email)) return fail(tFields('errors.invalidEmail'), 'email');
    if (!password) return fail(tFields('errors.passwordRequired'), 'password');
    setError(null);
    setInvalid(null);
    setPending('email');
    try {
      const { data, error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError) {
        if (signInError.status === 429) fail(tFields('errors.tooManyRequests'));
        // only a 401 is a wrong password: an outage mustn't send someone off to reset a correct one
        else if (signInError.status === 401) fail(t('errors.invalidCredentials'), 'both');
        else fail(t('errors.generic'));
        return;
      }
      if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
        setPending(null);
        setStep('twoFactor');
        return;
      }
      // the app is another root layout, so this is a full load either way
      window.location.assign(redirectTo);
    } catch {
      fail(t('errors.generic'));
    }
  };

  const continueWith = async (provider: OAuthProvider) => {
    if (pending) return;
    setError(null);
    setPending(provider);
    try {
      // errorCallbackURL keeps failures off better-auth's own error page, and keeps where the visitor was headed
      const { error: socialError } = await authClient.signIn.social({
        provider,
        callbackURL: redirectTo,
        // a first-time account headed for an invitation goes to it, not to onboarding
        newUserCallbackURL: inviteTokenFromCallback(redirectTo) ? redirectTo : '/onboarding?newUser=true',
        errorCallbackURL: signInPath(redirectTo),
      });
      if (socialError) {
        setPending(null);
        setError(t('errors.generic'));
      }
    } catch {
      setPending(null);
      setError(t('errors.generic'));
    }
  };

  if (step === 'twoFactor') {
    return (
      <div className={styles.root}>
        <TwoFactorStep
          redirectTo={redirectTo}
          onBack={() => {
            setStep('credentials');
            setRefocus(({ count }) => ({ count: count + 1, field: 'password' }));
          }}
          onEnded={(reason) => {
            setStep('credentials');
            setPassword('');
            fail(t(reason === 'tooManyCodes' ? 'errors.twoFactorTooMany' : 'errors.twoFactorExpired'));
          }}
        />
      </div>
    );
  }

  const isPending = pending !== null;
  return (
    <div className={styles.root}>
      <OAuthCells
        providers={providers}
        pending={pending === 'email' ? null : pending}
        disabled={isPending}
        onSelect={continueWith}
      />
      {notice ? (
        <p className={styles.notice} role='status'>
          {notice}
        </p>
      ) : null}
      {error ? <Alert id={ids.error}>{error}</Alert> : null}

      <AuthForm
        className={styles.form}
        pending={isPending}
        describedBy={error ? ids.error : undefined}
        onSubmit={signInWithEmail}
      >
        <Field id={ids.email} label={tFields('email')}>
          <EmailInput
            id={ids.email}
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            readOnly={isPending}
            invalid={invalid === 'email' || invalid === 'both'}
            describedBy={describedBy(error && ids.error)}
            autoComplete='username'
          />
        </Field>
        <Field
          id={ids.password}
          label={tFields('password')}
          aside={
            forgotPassword ? (
              <Link className={styles.link} href='/forgot-password'>
                {t('forgotPassword')}
              </Link>
            ) : null
          }
        >
          <PasswordInput
            id={ids.password}
            name='password'
            inputRef={passwordRef}
            value={password}
            onChange={setPassword}
            readOnly={isPending}
            invalid={invalid === 'password' || invalid === 'both'}
            describedBy={describedBy(error && ids.error)}
          />
        </Field>
        <SubmitButton
          pending={pending === 'email'}
          disabled={isPending}
          label={t('submit')}
          pendingLabel={t('submitting')}
        />
      </AuthForm>
    </div>
  );
}

function TwoFactorStep({
  redirectTo,
  onBack,
  onEnded,
}: {
  redirectTo: string;
  onBack: () => void;
  onEnded: (reason: 'tooManyCodes' | 'expired') => void;
}) {
  const t = useTranslations('public.auth.signin');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const errorId = `${id}-error`;
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cellsRef = useRef<HTMLDivElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);
  // a rejected backup code stays on screen; this keeps it from submitting itself again
  const lastSubmitted = useRef('');

  // the credentials submit leaves focus on <body>; the code should be typeable straight away, and a rejected
  // backup code selected, so retyping overwrites it
  useEffect(() => {
    if (pending) return;
    if (mode === 'totp') cellsRef.current?.querySelector('input')?.focus();
    else if (error) backupRef.current?.select();
    else backupRef.current?.focus();
  }, [pending, mode, error]);

  const verify = async (value = code) => {
    if (pending) return;
    lastSubmitted.current = value;
    setError(null);
    setPending(true);
    try {
      const { error: verifyError } =
        mode === 'backup'
          ? await authClient.twoFactor.verifyBackupCode({ code: value })
          : await authClient.twoFactor.verifyTotp({ code: value });
      if (verifyError) {
        const ended = twoFactorAttemptEnded(verifyError.code);
        if (ended) {
          onEnded(ended);
          return;
        }
        setPending(false);
        if (mode === 'totp') setCode('');
        setError(
          verifyError.status === 429
            ? tFields('errors.tooManyRequests')
            : verifyError.status === 401
              ? t(mode === 'backup' ? 'errors.invalidBackupCode' : 'errors.invalidOtp')
              : t('errors.generic'),
        );
        return;
      }
      window.location.assign(redirectTo);
    } catch {
      setPending(false);
      setError(t('errors.generic'));
    }
  };

  const switchMode = () => {
    setMode((current) => (current === 'totp' ? 'backup' : 'totp'));
    setCode('');
    setError(null);
    lastSubmitted.current = '';
  };

  const complete = mode === 'totp' ? code.length === OTP_LENGTH : code.length === BACKUP_CODE_LENGTH;

  return (
    <AuthForm
      className={styles.otp}
      pending={pending}
      describedBy={error ? errorId : undefined}
      onSubmit={() => verify()}
    >
      <div className={styles.otpHead}>
        <span className={styles.otpBadge}>
          <ShieldIcon />
        </span>
        <div>
          <h2 className={styles.otpTitle}>{t('twoFactor.title')}</h2>
          <p className={styles.otpText}>
            {t(mode === 'backup' ? 'twoFactor.backupCodeDescription' : 'twoFactor.description')}
          </p>
        </div>
      </div>
      {error ? <Alert id={errorId}>{error}</Alert> : null}
      {mode === 'totp' ? (
        <OTP.Root
          ref={cellsRef}
          className={styles.otpRoot}
          value={code}
          onValueChange={(value) => {
            setCode(value);
            if (value.length === OTP_LENGTH) verify(value);
          }}
          disabled={pending}
          validationType='numeric'
        >
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <Fragment key={index}>
              {index === OTP_LENGTH / 2 ? <span className={styles.otpDash} aria-hidden /> : null}
              <OTP.Input className={styles.otpCell} />
            </Fragment>
          ))}
          <OTP.HiddenInput name='totp' />
        </OTP.Root>
      ) : (
        <input
          ref={backupRef}
          className={cn(styles.input, styles.code)}
          name='backupCode'
          aria-label={t('twoFactor.backupCodeLabel')}
          placeholder='xxxxx-xxxxx'
          // not one-time-code: that would invite the authenticator's TOTP, which never fits here
          autoComplete='off'
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          maxLength={BACKUP_CODE_LENGTH}
          value={code}
          onChange={(event) => {
            const next = formatBackupCode(event.target.value);
            setCode(next);
            if (next.length === BACKUP_CODE_LENGTH && next !== lastSubmitted.current) verify(next);
          }}
          disabled={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      )}
      <SubmitButton
        pending={pending}
        disabled={!complete}
        label={t('twoFactor.verify')}
        pendingLabel={t('submitting')}
      />
      <div className={styles.textButtons}>
        <button type='button' className={styles.textButton} onClick={onBack} disabled={pending}>
          <ArrowLeftIcon />
          {t('twoFactor.back')}
        </button>
        <button type='button' className={styles.textButton} onClick={switchMode} disabled={pending}>
          {t(mode === 'backup' ? 'twoFactor.useAuthenticator' : 'twoFactor.useBackupCode')}
        </button>
      </div>
    </AuthForm>
  );
}
