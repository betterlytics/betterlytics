'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { acceptPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { isUserInvitedDashboardMemberAction } from '@/app/actions/index.actions';
import { RegisterUserSchema } from '@/entities/auth/user.entities';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { baEvent } from '@/lib/ba-event';
import { FINE_LINK } from '@/landing/components/ui/text';
import {
  Alert,
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
  const [email, setEmail] = useState(invitedEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<'email' | OAuthProvider | null>(null);
  const ids = { error: `${id}-error`, email: `${id}-email`, password: `${id}-password`, rules: `${id}-rules` };

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
        setError(t('errors.generic'));
      }
    } catch {
      setPending(null);
      setError(t('errors.generic'));
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
      setError(
        field === 'password'
          ? tFields('errors.weakPassword')
          : field === 'email'
            ? tFields('errors.invalidEmail')
            : t('errors.generic'),
      );
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
        setPending(null);
        setError(
          signUpError.status === 429
            ? tFields('errors.tooManyRequests')
            : signUpError.code?.startsWith('USER_ALREADY_EXISTS')
              ? t('errors.emailExists')
              : signUpError.code === 'SIGNUP_DISABLED'
                ? t('errors.registrationDisabled')
                : t('errors.generic'),
        );
        return;
      }
    } catch {
      setPending(null);
      setError(t('errors.generic'));
      return;
    }

    baEvent('onboarding-account-created');
    // a full load each way: the app has its own root layout
    if (redirectTo) {
      window.location.assign(redirectTo);
      return;
    }
    // an invited user goes straight to the dashboards they were invited to
    let destination = '/onboarding';
    try {
      const accepted = await acceptPendingInvitationsAction();
      const member = await isUserInvitedDashboardMemberAction();
      if ((accepted.success && accepted.data.length > 0) || (member.success && member.data))
        destination = '/dashboards';
    } catch {}
    window.location.assign(destination);
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
      {error ? <Alert id={ids.error}>{error}</Alert> : null}

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          register();
        }}
        aria-describedby={error ? ids.error : undefined}
      >
        <Field id={ids.email} label={tFields('email')}>
          <EmailInput
            id={ids.email}
            value={email}
            onChange={setEmail}
            disabled={isPending}
            readOnly={Boolean(invitedEmail)}
          />
        </Field>
        <Field id={ids.password} label={tFields('password')}>
          <PasswordInput
            id={ids.password}
            name='password'
            value={password}
            onChange={setPassword}
            disabled={isPending}
            autoComplete='new-password'
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
      </form>

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
