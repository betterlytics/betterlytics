'use client';

import { useState, type ReactNode, type Ref } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_RULES } from '@/entities/auth/password.entities';
import { cn } from '@/landing/lib/cn';
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon, GoogleMark, Spinner } from './icons';
import styles from './authForm.module.css';

export type OAuthProvider = 'google' | 'github';
export type Providers = Record<OAuthProvider, boolean>;

const PROVIDERS = [
  { id: 'google', name: 'Google', Mark: GoogleMark },
  { id: 'github', name: 'GitHub', Mark: GitHubIcon },
] as const;

/**
 * Lets password generators make one that passes PasswordSchema. `allowed` matters: without it only the required
 * classes may be used, and generated passwords would be letters only.
 */
const PASSWORD_RULES_HINT = `minlength: ${PASSWORD_MIN_LENGTH}; maxlength: ${PASSWORD_MAX_LENGTH}; required: lower; required: upper; allowed: digit, special;`;

/**
 * Every auth form. POST, so a submit before hydration puts nothing in the URL (logs, history, the page tracker);
 * once hydrated, `onSubmit` takes over. `noValidate`: each form checks its own fields and says what's wrong in the
 * page's language and style; the browser's bubbles follow the browser's language and vanish. `required` and
 * `type='email'` stay on the fields for screen readers and phone keyboards.
 */
export function AuthForm({
  className,
  pending = false,
  describedBy,
  onSubmit,
  children,
}: {
  className?: string;
  pending?: boolean;
  describedBy?: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <form
      method='post'
      noValidate
      className={className}
      data-pending={pending || undefined}
      aria-describedby={describedBy}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}

const EMAIL = z.string().email();

/** The same check the server's schemas make, for a form to run before it submits. */
export function isEmailAddress(value: string) {
  return EMAIL.safeParse(value.trim()).success;
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

/** Read-only rather than disabled while a request runs, so focus stays put and can come back to it on an error. */
export function EmailInput({
  id,
  value,
  onChange,
  readOnly,
  invalid,
  describedBy,
  autoComplete = 'email',
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  invalid?: boolean;
  /** The error, while there is one: focus comes back to the field, and it should say why. */
  describedBy?: string;
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
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    />
  );
}

/** Joins the ids a field is described by, leaving out the absent ones. */
export function describedBy(...ids: (string | false | null | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  readOnly,
  isNew = false,
  invalid,
  describedBy,
  inputRef,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  /** A password being chosen rather than entered: autofill offers to generate one. */
  isNew?: boolean;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const t = useTranslations('public.auth.fields');
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={cn(styles.inputWrap, styles.control)}>
      <input
        ref={inputRef}
        id={id}
        className={styles.input}
        type={revealed ? 'text' : 'password'}
        name={name}
        autoComplete={isNew ? 'new-password' : 'current-password'}
        {...(isNew && { passwordrules: PASSWORD_RULES_HINT })}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      {/* one fixed label, its state in aria-pressed: a label that flips too would be read as the opposite action */}
      <button
        type='button'
        className={styles.reveal}
        aria-label={t('showPassword')}
        aria-pressed={revealed}
        onClick={() => setRevealed((shown) => !shown)}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/** PasswordSchema's rules, each ticking off as it is met; the tick is spelled out for screen readers. */
export function PasswordRules({ id, password }: { id: string; password: string }) {
  const t = useTranslations('public.auth.fields.rules');
  const rules = (['length', 'lower', 'upper'] as const).map((rule) => ({
    label: t(rule),
    met: PASSWORD_RULES[rule](password),
  }));
  return (
    <ul id={id} className={styles.rules} aria-label={t('label')}>
      {rules.map((rule) => (
        <li key={rule.label} data-met={rule.met || undefined}>
          <CheckIcon />
          {rule.label}
          <span className='sr-only'>, {rule.met ? t('met') : t('unmet')}</span>
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
