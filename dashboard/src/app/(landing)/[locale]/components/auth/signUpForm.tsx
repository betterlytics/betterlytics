'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { acceptPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { RegisterUserSchema } from '@/entities/auth/user.entities';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { baEvent } from '@/lib/ba-event';
import { FINE_LINK } from '@/landing/components/ui/text';
import {
  Alert,
  AuthForm,
  EmailInput,
  Field,
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
  /** An open invitation's address, which the account must use. */
  invitedEmail?: string;
  inviteToken?: string;
  /** Where to go once the account exists; an invitation's accept page, else onboarding. */
  redirectTo?: string;
  /** Cloud only; self-host is not bound by our terms. */
  requireTerms: boolean;
};

/** Google and GitHub, then email and a password whose rules tick off; the terms are agreed to by continuing. */
export function SignUpForm({ providers, invitedEmail, inviteToken, redirectTo, requireTerms }: SignUpFormProps) {
  const t = useTranslations('public.auth.register');
  const tFields = useTranslations('public.auth.fields');
  const locale = useLocale();
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(invitedEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; field: 'email' | 'password' | null } | null>(null);
  const [pending, setPending] = useState<'email' | OAuthProvider | null>(null);
  const ids = { error: `${id}-error`, email: `${id}-email`, password: `${id}-password`, rules: `${id}-rules` };

  // back to the field the error is about, else the first one; an invited address is fixed, so then the password
  useEffect(() => {
    if (!error) return;
    const field = error.field === 'password' || invitedEmail ? passwordRef.current : emailRef.current;
    field?.focus();
    field?.select();
  }, [error, invitedEmail]);

  const fail = (message: string, field: 'email' | 'password' | null = null) => {
    setPending(null);
    setError({ message, field });
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
        errorCallbackURL: redirectTo ? `/signin?callbackUrl=${encodeURIComponent(redirectTo)}` : '/signin',
      });
      if (socialError) {
        setPending(null);
        setError({ message: t('errors.generic'), field: null });
      }
    } catch {
      setPending(null);
      setError({ message: t('errors.generic'), field: null });
    }
  };

  const register = async () => {
    if (pending) return;
    // continuing is the act of agreeing (the line under the form), so on cloud the terms are accepted here
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
            describedBy={ids.rules}
          />
        </Field>
        <PasswordRules id={ids.rules} password={password} />
        <SubmitButton
          pending={pending === 'email'}
          disabled={isPending}
          label={t('submit')}
          pendingLabel={t('submitting')}
        />
      </AuthForm>

      {requireTerms ? (
        <p className={styles.legal}>
          {t.rich('legal', {
            terms: (chunks) => (
              <Link className={FINE_LINK} href='/terms'>
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link className={FINE_LINK} href='/privacy'>
                {chunks}
              </Link>
            ),
          })}
        </p>
      ) : null}
    </div>
  );
}
