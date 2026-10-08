'use client';

import { useState, type ReactNode, type Ref } from 'react';
import { useTranslations } from 'next-intl';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { cn } from '@/landing/lib/cn';
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon, GoogleMark, Spinner } from './icons';
import styles from './authForm.module.css';

export type OAuthProvider = 'google' | 'github';
export type Providers = Record<OAuthProvider, boolean>;

const PROVIDERS = [
  { id: 'google', name: 'Google', Mark: GoogleMark },
  { id: 'github', name: 'GitHub', Mark: GitHubIcon },
] as const;

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

export function EmailInput({
  id,
  value,
  onChange,
  disabled,
  readOnly,
  invalid,
  autoComplete = 'email',
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  autoComplete?: 'email' | 'username';
  inputRef?: Ref<HTMLInputElement>;
}) {
  const t = useTranslations('public.auth.fields');
  return (
    <input
      ref={inputRef}
      id={id}
      className={cn(styles.input, styles.control)}
      type='email'
      name='email'
      autoComplete={autoComplete}
      inputMode='email'
      spellCheck={false}
      required
      placeholder={t('emailPlaceholder')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
    />
  );
}

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  disabled,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete: 'current-password' | 'new-password';
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = useTranslations('public.auth.fields');
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={cn(styles.inputWrap, styles.control)}>
      <input
        id={id}
        className={styles.input}
        type={revealed ? 'text' : 'password'}
        name={name}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button
        type='button'
        className={styles.reveal}
        aria-label={revealed ? t('hidePassword') : t('showPassword')}
        aria-pressed={revealed}
        onClick={() => setRevealed((shown) => !shown)}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/** The password's rules (the app's PasswordSchema), each ticking off as it is met. */
export function PasswordRules({ id, password }: { id: string; password: string }) {
  const t = useTranslations('public.auth.fields.rules');
  const rules = [
    { label: t('length'), met: password.length >= 8 },
    { label: t('lower'), met: /[a-z]/.test(password) },
    { label: t('upper'), met: /[A-Z]/.test(password) },
  ];
  return (
    <ul id={id} className={styles.rules} aria-label={t('label')}>
      {rules.map((rule) => (
        <li key={rule.label} data-met={rule.met || undefined}>
          <CheckIcon />
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

/** Google and GitHub as a strip of cells, flush under the panel's header. */
export function OAuthCells({
  providers,
  pending,
  disabled,
  onSelect,
}: {
  providers: Providers;
  pending: OAuthProvider | null;
  disabled: boolean;
  onSelect: (provider: OAuthProvider) => void;
}) {
  const t = useTranslations('public.auth.fields');
  const enabled = PROVIDERS.filter((provider) => providers[provider.id]);
  if (enabled.length === 0) return null;
  return (
    <div className={styles.cells} data-oauth='cells'>
      {enabled.map(({ id, name, Mark }) => (
        <button
          key={id}
          type='button'
          className={styles.secondary}
          aria-label={t('continueWith', { provider: name })}
          aria-busy={pending === id || undefined}
          disabled={disabled}
          onClick={() => onSelect(id)}
        >
          {pending === id ? <Spinner className={styles.spin} /> : <Mark className={styles.mark} />}
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}

export function SubmitButton({
  pending,
  disabled,
  label,
  pendingLabel,
}: {
  pending: boolean;
  disabled?: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type='submit'
      className={styles.primary}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <>
          <Spinner className={styles.spin} />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
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
