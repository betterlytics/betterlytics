'use client';

import { useId, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { acceptPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { isUserInvitedDashboardMemberAction, registerUserAction } from '@/app/actions/index.actions';
import { RegisterUserSchema } from '@/entities/auth/user.entities';
import { Link } from '@/i18n/navigation';
import { baEvent } from '@/lib/ba-event';
import { cn } from '@/landing/lib/cn';
import { CheckIcon, EyeIcon, EyeOffIcon, MailIcon, Spinner } from '@/landing/signin/_auth/icons';
import { Alert, Divider, Field, OAuthButton } from '@/landing/signin/_auth/signInForm';
import form from '@/landing/signin/_auth/signInForm.module.css';
import type { FlowProps, Method } from '@/landing/signin/_auth/types';
import { HorizonHeading, HorizonTile } from './horizonStage';
import { FINE_LINK } from './shared';
import styles from './horizon.module.css';

/** Horizon's sign-up: the same stage as its sign-in, with the password rules ticking off as you type. */
export function HorizonSignUp({ copy, providers, preview, hrefs }: FlowProps) {
  const locale = useLocale();
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(preview === 'error' ? copy.signUpErrors.generic : null);
  const [pending, setPending] = useState<Method | null>(preview === 'loading' ? 'email' : null);
  const hasOAuth = providers.google || providers.github;
  const [open, setOpen] = useState(!hasOAuth || preview !== null);
  const isPending = pending !== null;
  const ids = { form: `${id}-form`, error: `${id}-error`, email: `${id}-email`, password: `${id}-password` };

  const rules = [
    { label: copy.ruleLength, met: password.length >= 8 },
    { label: copy.ruleLower, met: /[a-z]/.test(password) },
    { label: copy.ruleUpper, met: /[A-Z]/.test(password) },
  ];

  const continueWith = (provider: Exclude<Method, 'email'>) => {
    setError(null);
    setPending(provider);
    signIn(provider, { callbackUrl: '/dashboards' }).catch(() => {
      setError(copy.signUpErrors.generic);
      setPending(null);
    });
  };

  const register = async () => {
    // agreeing is the act of continuing (see the line under the form), so the terms are accepted here
    const parsed = RegisterUserSchema.safeParse({ email, password, acceptedTerms: true, language: locale });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? copy.signUpErrors.checkInput);
      return;
    }
    setError(null);
    setPending('email');
    const result = await registerUserAction(parsed.data);
    if (!result.success) {
      setError(result.error.message);
      setPending(null);
      return;
    }
    const signedIn = await signIn('credentials', { email, password, redirect: false });
    if (signedIn?.error) {
      setError(copy.signUpErrors.signInAfter);
      setPending(null);
      return;
    }
    baEvent('onboarding-account-created');
    // an invited user goes straight to the dashboards they were invited to
    let destination = '/onboarding';
    try {
      const accepted = await acceptPendingInvitationsAction();
      const member = await isUserInvitedDashboardMemberAction();
      if ((accepted.success && accepted.data.length > 0) || (member.success && member.data)) destination = '/dashboards';
    } catch {}
    // a full load: the app has its own root layout
    window.location.assign(destination);
  };

  return (
    <div className={styles.stage}>
      <HorizonTile pending={isPending} />
      <HorizonHeading title={copy.signUpTitle} lede={copy.signUpLede} />

      <div className={cn(form.root, 'mt-10 w-full')}>
        {error ? <Alert id={ids.error}>{error}</Alert> : null}

        {hasOAuth ? (
          <div className={form.oauth} data-oauth='stack'>
            {(['google', 'github'] as const)
              .filter((provider) => providers[provider])
              .map((provider) => (
                <OAuthButton
                  key={provider}
                  provider={provider}
                  label={copy[provider]}
                  ariaLabel={copy[provider]}
                  pending={pending === provider}
                  disabled={isPending}
                  onClick={() => continueWith(provider)}
                />
              ))}
          </div>
        ) : null}
        {hasOAuth ? <Divider label={copy.or} /> : null}

        {hasOAuth && !open ? (
          <button
            type='button'
            className={form.secondary}
            aria-expanded={false}
            aria-controls={ids.form}
            onClick={() => {
              setOpen(true);
              requestAnimationFrame(() => emailRef.current?.focus());
            }}
          >
            <MailIcon className={form.mark} />
            <span>{copy.continueWithEmail}</span>
          </button>
        ) : null}

        <div className={form.collapse} data-open={open || undefined}>
          <form
            id={ids.form}
            className={form.form}
            onSubmit={(event) => {
              event.preventDefault();
              register();
            }}
            inert={!open || undefined}
            aria-describedby={error ? ids.error : undefined}
          >
            <Field id={ids.email} label={copy.emailLabel}>
              <input
                ref={emailRef}
                id={ids.email}
                className={cn(form.input, form.control)}
                type='email'
                name='email'
                autoComplete='email'
                inputMode='email'
                spellCheck={false}
                required
                placeholder={copy.emailExample}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isPending}
              />
            </Field>
            <Field id={ids.password} label={copy.passwordLabel}>
              <div className={cn(form.inputWrap, form.control)}>
                <input
                  id={ids.password}
                  className={form.input}
                  type={revealed ? 'text' : 'password'}
                  name='password'
                  autoComplete='new-password'
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isPending}
                  aria-describedby={`${ids.password}-rules`}
                />
                <button
                  type='button'
                  className={form.reveal}
                  aria-label={revealed ? copy.hidePassword : copy.showPassword}
                  aria-pressed={revealed}
                  onClick={() => setRevealed((value) => !value)}
                >
                  {revealed ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </Field>
            <ul id={`${ids.password}-rules`} className={styles.rules} aria-label={copy.passwordRules}>
              {rules.map((rule) => (
                <li key={rule.label} data-met={rule.met || undefined}>
                  <CheckIcon />
                  {rule.label}
                </li>
              ))}
            </ul>
            <button type='submit' className={form.primary} disabled={isPending} aria-busy={pending === 'email'}>
              {pending === 'email' ? (
                <>
                  <Spinner className={form.spin} />
                  {copy.creatingAccount}
                </>
              ) : (
                copy.createAccountSubmit
              )}
            </button>
          </form>
        </div>

        <p className={styles.legal}>
          {copy.legalLead}{' '}
          <Link className={FINE_LINK} href='/terms'>
            {copy.termsLong}
          </Link>{' '}
          {copy.and}{' '}
          <Link className={FINE_LINK} href='/privacy'>
            {copy.privacyLong}
          </Link>
          .
        </p>
      </div>

      <p className='mt-8 text-center text-label text-on-volt/70'>
        {copy.haveAccount}{' '}
        <Link className={cn('font-medium text-fg', FINE_LINK)} href={hrefs.signIn}>
          {copy.signInLink}
        </Link>
      </p>
    </div>
  );
}
