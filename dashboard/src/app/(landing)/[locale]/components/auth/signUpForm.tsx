'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { acceptPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { RegisterUserSchema } from '@/entities/auth/user.entities';
import { Link } from '@/i18n/navigation';
import { signUpPath } from '@/lib/auth/auth-page-state';
import { authClient } from '@/lib/auth-client';
import { baEvent } from '@/lib/ba-event';
import { FINE_LINK } from '@/landing/components/ui/text';
import {
  Alert,
  AuthForm,
  describedBy,
  EmailInput,
  Field,
  isEmailAddress,
  OAuthCells,
  PasswordInput,
  PasswordRules,
  SubmitButton,
  type OAuthProvider,
  type Providers,
} from './fields';
import styles from './authForm.module.css';

type SignUpFormProps = {
  providers: Providers;
  /** The account must use this address. */
  invitedEmail?: string;
  inviteToken?: string;
  /** An invitation's accept page; without one, sign-up goes on to onboarding. */
  redirectTo?: string;
  /** Cloud only; self-host is not bound by our terms. */
  requireTerms: boolean;
  initialError?: string | null;
};

type FormError = { message: string; field: 'email' | 'password' | 'terms' | null; focus: boolean };

export function SignUpForm({
  providers,
  invitedEmail,
  inviteToken,
  redirectTo,
  requireTerms,
  initialError,
}: SignUpFormProps) {
  const t = useTranslations('public.auth.register');
  const tFields = useTranslations('public.auth.fields');
  const locale = useLocale();
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(invitedEmail ?? '');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<FormError | null>(
    initialError ? { message: initialError, field: null, focus: false } : null,
  );
  const [pending, setPending] = useState<'email' | OAuthProvider | null>(null);
  const ids = {
    error: `${id}-error`,
    email: `${id}-email`,
    password: `${id}-password`,
    rules: `${id}-rules`,
    terms: `${id}-terms`,
  };

  // an invited address is fixed, so focus goes to the password instead
  useEffect(() => {
    if (!error?.focus) return;
    if (error.field === 'terms') {
      termsRef.current?.focus();
      return;
    }
    const field = error.field === 'password' || invitedEmail ? passwordRef.current : emailRef.current;
    field?.focus();
    field?.select();
  }, [error, invitedEmail]);

  const fail = (message: string, field: FormError['field'] = null) => {
    setPending(null);
    setError({ message, field, focus: true });
  };

  const continueWith = async (provider: OAuthProvider) => {
    if (pending) return;
    setError(null);
    setPending(provider);
    try {
      const { error: socialError } = await authClient.signIn.social({
        provider,
        callbackURL: redirectTo ?? '/dashboards',
        newUserCallbackURL: redirectTo ?? '/onboarding?newUser=true',
        // back here, invite and all, so a cancel or a refusal leaves the visitor where they started
        errorCallbackURL: signUpPath(inviteToken),
      });
      if (socialError) fail(t('errors.generic'));
    } catch {
      fail(t('errors.generic'));
    }
  };

  const register = async () => {
    if (pending) return;
    // top to bottom, so the first problem on the page is the one reported
    if (!email.trim()) return fail(tFields('errors.emailRequired'), 'email');
    if (!isEmailAddress(email)) return fail(tFields('errors.invalidEmail'), 'email');
    if (!password) return fail(tFields('errors.passwordRequired'), 'password');
    const parsed = RegisterUserSchema.safeParse({
      email,
      password,
      acceptedTerms: requireTerms ? true : undefined,
      language: locale,
    });
    if (!parsed.success) {
      const field = parsed.error.errors[0]?.path[0];
      if (field === 'password') fail(tFields('errors.weakPassword'), 'password');
      else if (field === 'email') fail(tFields('errors.invalidEmail'), 'email');
      else fail(t('errors.generic'));
      return;
    }
    if (requireTerms && !acceptedTerms) return fail(t('errors.termsRequired'), 'terms');
    setError(null);
    setPending('email');
    try {
      // the server's sign-up hooks read the terms, language and invite from the body, beyond the typed fields
      const signUpBody = {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name ?? '',
        acceptedTerms: parsed.data.acceptedTerms,
        language: parsed.data.language,
        ...(inviteToken && { invite: inviteToken }),
      };
      const { error: signUpError } = await authClient.signUp.email(signUpBody);
      if (signUpError) {
        if (signUpError.status === 429) fail(tFields('errors.tooManyRequests'));
        else if (signUpError.code?.startsWith('USER_ALREADY_EXISTS')) fail(t('errors.emailExists'), 'email');
        else if (signUpError.code === 'SIGNUP_DISABLED') fail(t('errors.registrationDisabled'));
        else fail(t('errors.generic'));
        return;
      }
    } catch {
      fail(t('errors.generic'));
      return;
    }

    baEvent('onboarding-account-created');
    // a full load each way: the app has its own root layout
    if (redirectTo) {
      window.location.assign(redirectTo);
      return;
    }
    // onboarding sends anyone who is now a member of an invited dashboard on to the dashboards
    try {
      await acceptPendingInvitationsAction();
    } catch {}
    window.location.assign('/onboarding');
  };

  const isPending = pending !== null;
  return (
    <div className={styles.root}>
      <OAuthCells
        providers={providers}
        pending={pending === 'email' ? null : pending}
        disabled={isPending}
        onSelect={continueWith}
      />
      {error ? <Alert id={ids.error}>{error.message}</Alert> : null}

      <AuthForm
        className={styles.form}
        pending={isPending}
        describedBy={error ? ids.error : undefined}
        onSubmit={register}
      >
        <Field id={ids.email} label={tFields('email')}>
          <EmailInput
            id={ids.email}
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            readOnly={isPending || Boolean(invitedEmail)}
            invalid={error?.field === 'email'}
            describedBy={describedBy(error && ids.error)}
            autoComplete='username'
          />
        </Field>
        <Field id={ids.password} label={tFields('password')}>
          <PasswordInput
            id={ids.password}
            name='password'
            inputRef={passwordRef}
            value={password}
            onChange={setPassword}
            readOnly={isPending}
            isNew
            invalid={error?.field === 'password'}
            describedBy={describedBy(error && ids.error, ids.rules)}
          />
        </Field>
        <PasswordRules id={ids.rules} password={password} />
        {requireTerms ? (
          <div className={styles.check}>
            <input
              ref={termsRef}
              id={ids.terms}
              type='checkbox'
              name='acceptedTerms'
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                if (event.target.checked && error?.field === 'terms') setError(null);
              }}
              disabled={isPending}
              aria-invalid={error?.field === 'terms' || undefined}
              aria-describedby={describedBy(error?.field === 'terms' && ids.error)}
            />
            {/* the policies open in a new tab, so the form isn't lost */}
            <label htmlFor={ids.terms}>
              {t.rich('termsAgree', {
                terms: (chunks) => (
                  <Link className={FINE_LINK} href='/terms' target='_blank' rel='noopener noreferrer'>
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link className={FINE_LINK} href='/privacy' target='_blank' rel='noopener noreferrer'>
                    {chunks}
                  </Link>
                ),
              })}
            </label>
          </div>
        ) : null}
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
