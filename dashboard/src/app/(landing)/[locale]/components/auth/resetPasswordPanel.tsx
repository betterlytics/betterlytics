'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResetPasswordSchema } from '@/entities/auth/passwordReset.entities';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import { AuthAction, AuthPanel, AuthPrompt } from './authPanel';
import { Alert, Field, PasswordInput, PasswordRules, SubmitButton } from './fields';
import styles from './authForm.module.css';

/** From the emailed link (its token already checked by the page): a new password twice, its rules ticking off. */
export function ResetPasswordPanel({ token }: { token: string }) {
  const t = useTranslations('public.auth.resetPassword');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { error: `${id}-error`, password: `${id}-password`, confirm: `${id}-confirm`, rules: `${id}-rules` };

  const save = async () => {
    if (pending) return;
    const parsed = ResetPasswordSchema.safeParse({ token, newPassword: password, confirmPassword: confirm });
    if (!parsed.success) {
      const field = parsed.error.errors[0]?.path[0];
      setError(
        field === 'token'
          ? t('errors.invalidToken')
          : field === 'confirmPassword'
            ? tFields('errors.passwordsDoNotMatch')
            : tFields('errors.weakPassword'),
      );
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: parsed.data.newPassword,
        token: parsed.data.token,
      });
      setPending(false);
      if (resetError) {
        setError(
          resetError.status === 429
            ? tFields('errors.tooManyRequests')
            : resetError.code === 'INVALID_TOKEN'
              ? t('errors.invalidToken')
              : resetError.code === 'WEAK_PASSWORD'
                ? tFields('errors.weakPassword')
                : t('errors.generic'),
        );
        return;
      }
      setDone(true);
    } catch {
      setPending(false);
      setError(t('errors.generic'));
    }
  };

  if (done) {
    return (
      <AuthPanel title={t('doneTitle')} lede={t('doneLede')}>
        <div role='status'>
          <AuthAction href='/signin' label={t('signIn')} />
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title={t('title')}
      lede={t('lede')}
      foot={<AuthPrompt lead={t('remember')} href='/signin' label={t('signIn')} />}
    >
      <form
        className={cn(styles.root, styles.form)}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        aria-describedby={error ? ids.error : undefined}
      >
        {error ? <Alert id={ids.error}>{error}</Alert> : null}
        <Field id={ids.password} label={tFields('newPassword')}>
          <PasswordInput
            id={ids.password}
            name='newPassword'
            value={password}
            onChange={setPassword}
            disabled={pending}
            autoComplete='new-password'
            describedBy={ids.rules}
          />
        </Field>
        <PasswordRules id={ids.rules} password={password} />
        <Field id={ids.confirm} label={tFields('confirmPassword')}>
          <PasswordInput
            id={ids.confirm}
            name='confirmPassword'
            value={confirm}
            onChange={setConfirm}
            disabled={pending}
            autoComplete='new-password'
          />
        </Field>
        <SubmitButton pending={pending} label={t('submit')} pendingLabel={t('submitting')} />
      </form>
    </AuthPanel>
  );
}
