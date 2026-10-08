'use client';

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import * as OTP from '@radix-ui/react-one-time-password-field';
import { Link } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';
import type { SignInCopy } from './copy';
import {
  AlertIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  GitHubMark,
  GoogleMark,
  MailIcon,
  ShieldIcon,
  Spinner,
} from './icons';
import type { OAuthProvider, PreviewState, Providers } from './types';
import { useSignIn, type SignInState } from './useSignIn';
import styles from './signInForm.module.css';

const OTP_LENGTH = 6;
const BRAND_NAMES: Record<OAuthProvider, string> = { google: 'Google', github: 'GitHub' };

type SignInFormProps = {
  copy: SignInCopy;
  providers: Providers;
  forgotPassword: boolean;
  preview: PreviewState;
  /** `mono` sets field labels as the landing's small uppercase mono captions. */
  labels?: 'sans' | 'mono';
  /** `row` and `cells` show brand names only; `cells` runs edge to edge, for sectioned panels. */
  oauth?: 'stack' | 'row' | 'cells';
  order?: 'oauth-first' | 'email-first';
  /** Keeps the email form folded behind "Continue with email" until asked for. */
  disclosure?: boolean;
  onPendingChange?: (pending: boolean) => void;
  forgotHref?: string;
  className?: string;
};

export function SignInForm({
  copy,
  providers,
  forgotPassword,
  preview,
  labels = 'sans',
  oauth = 'stack',
  order = 'email-first',
  disclosure = false,
  onPendingChange,
  forgotHref = '/forgot-password',
  className,
}: SignInFormProps) {
  const auth = useSignIn(copy, preview);
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [revealed, setRevealed] = useState(false);
  const hasOAuth = providers.google || providers.github;
  const [open, setOpen] = useState(!disclosure || !hasOAuth || preview === 'error' || preview === 'loading');

  // returning email users get their form unfolded
  useEffect(() => {
    if (auth.lastUsed === 'email') setOpen(true);
  }, [auth.lastUsed]);

  const isPending = auth.pending !== null;
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  const ids = { form: `${id}-form`, error: `${id}-error`, email: `${id}-email`, password: `${id}-password` };

  if (auth.step === 'otp') {
    return (
      <div className={cn(styles.root, labels === 'mono' && styles.mono, className)}>
        <OtpStep copy={copy} auth={auth} formId={ids.form} errorId={ids.error} />
      </div>
    );
  }

  const oauthButtons = hasOAuth ? (
    <div className={cn(styles.oauth, styles[oauth])} data-oauth={oauth}>
      {(['google', 'github'] as const)
        .filter((provider) => providers[provider])
        .map((provider) => (
          <OAuthButton
            key={provider}
            provider={provider}
            label={oauth === 'stack' ? copy[provider] : BRAND_NAMES[provider]}
            ariaLabel={copy[provider]}
            pending={auth.pending === provider}
            disabled={isPending}
            onClick={() => auth.continueWith(provider)}
          />
        ))}
    </div>
  ) : null;
  const divider = oauth === 'cells' ? null : <Divider label={copy.or} />;

  return (
    <div className={cn(styles.root, labels === 'mono' && styles.mono, className)}>
      {copy.notice ? (
        <p className={styles.notice} role='status'>
          {copy.notice}
        </p>
      ) : null}
      {auth.error ? <Alert id={ids.error}>{auth.error}</Alert> : null}

      {order === 'oauth-first' && oauthButtons}
      {order === 'oauth-first' && hasOAuth && divider}

      {disclosure && hasOAuth && !open ? (
        <button
          type='button'
          className={styles.secondary}
          aria-expanded={false}
          aria-controls={ids.form}
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => emailRef.current?.focus());
          }}
        >
          <MailIcon className={styles.mark} />
          <span>{copy.continueWithEmail}</span>
        </button>
      ) : null}

      <div className={styles.collapse} data-open={open || undefined}>
        <form
          id={ids.form}
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            auth.submit();
          }}
          inert={!open || undefined}
          aria-describedby={auth.error ? ids.error : undefined}
        >
          <Field
            id={ids.email}
            label={copy.emailLabel}
          >
            <input
              ref={emailRef}
              id={ids.email}
              className={cn(styles.input, styles.control)}
              type='email'
              name='email'
              autoComplete='username'
              inputMode='email'
              spellCheck={false}
              required
              placeholder={copy.emailExample}
              value={auth.email}
              onChange={(event) => auth.setEmail(event.target.value)}
              disabled={isPending}
              aria-invalid={auth.error ? true : undefined}
            />
          </Field>
          <Field
            id={ids.password}
            label={copy.passwordLabel}
            aside={
              forgotPassword ? (
                <Link className={styles.link} href={forgotHref}>
                  {labels === 'mono' ? copy.forgotShort : copy.forgotPassword}
                </Link>
              ) : null
            }
          >
            <div className={cn(styles.inputWrap, styles.control)}>
              <input
                id={ids.password}
                className={styles.input}
                type={revealed ? 'text' : 'password'}
                name='password'
                autoComplete='current-password'
                required
                value={auth.password}
                onChange={(event) => auth.setPassword(event.target.value)}
                disabled={isPending}
                aria-invalid={auth.error ? true : undefined}
              />
              <button
                type='button'
                className={styles.reveal}
                aria-label={revealed ? copy.hidePassword : copy.showPassword}
                aria-pressed={revealed}
                onClick={() => setRevealed((value) => !value)}
              >
                {revealed ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>
          <button type='submit' className={styles.primary} disabled={isPending} aria-busy={auth.pending === 'email'}>
            {auth.pending === 'email' ? (
              <>
                <Spinner className={styles.spin} />
                {copy.submitting}
              </>
            ) : (
              copy.submit
            )}
          </button>
        </form>
      </div>

      {order === 'email-first' && hasOAuth && divider}
      {order === 'email-first' && oauthButtons}
    </div>
  );
}

export function Field({
  id,
  label,
  aside,
  children,
}: {
  id: string;
  label: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {/* after the control in the DOM, so tabbing goes field to field; the grid lifts it beside the label */}
      {children}
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </div>
  );
}

export function OAuthButton({
  provider,
  label,
  ariaLabel,
  pending,
  disabled,
  onClick,
}: {
  provider: OAuthProvider;
  label: string;
  ariaLabel: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Mark = provider === 'google' ? GoogleMark : GitHubMark;
  return (
    <button
      type='button'
      className={styles.secondary}
      aria-label={label === ariaLabel ? undefined : ariaLabel}
      aria-busy={pending || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {pending ? <Spinner className={styles.spin} /> : <Mark className={styles.mark} />}
      <span>{label}</span>
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className={styles.divider} role='separator'>
      <span>{label}</span>
    </div>
  );
}

export function Alert({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className={styles.alert} role='alert'>
      <AlertIcon />
      <p>{children}</p>
    </div>
  );
}

function OtpStep({
  copy,
  auth,
  formId,
  errorId,
}: {
  copy: SignInCopy;
  auth: SignInState;
  formId: string;
  errorId: string;
}) {
  const isPending = auth.pending !== null;
  const cellsRef = useRef<HTMLDivElement>(null);

  // the credentials submit leaves focus on <body>; the code should be typeable straight away
  useEffect(() => {
    if (!isPending) cellsRef.current?.querySelector('input')?.focus();
  }, [isPending]);

  return (
    <form
      id={formId}
      className={styles.otp}
      onSubmit={(event) => {
        event.preventDefault();
        auth.submit();
      }}
      aria-describedby={auth.error ? errorId : undefined}
    >
      <div className={styles.otpHead}>
        <span className={styles.otpBadge}>
          <ShieldIcon />
        </span>
        <div>
          <h2 className={styles.otpTitle}>{copy.twoFactor.title}</h2>
          <p className={styles.otpText}>{copy.twoFactor.description}</p>
        </div>
      </div>
      {auth.error ? <Alert id={errorId}>{auth.error}</Alert> : null}
      <OTP.Root
        ref={cellsRef}
        className={styles.otpRoot}
        value={auth.totp}
        onValueChange={(value) => {
          auth.setTotp(value);
          if (value.length === OTP_LENGTH) auth.submit(value);
        }}
        disabled={isPending}
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
      <button
        type='submit'
        className={styles.primary}
        disabled={isPending || auth.totp.length < OTP_LENGTH}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Spinner className={styles.spin} />
            {copy.submitting}
          </>
        ) : (
          copy.verify
        )}
      </button>
      <button type='button' className={styles.textButton} onClick={auth.backToCredentials}>
        <ArrowLeftIcon />
        {copy.back}
      </button>
    </form>
  );
}
