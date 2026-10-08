'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResetPasswordSchema } from '@/entities/auth/passwordReset.entities';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import { AuthAction, AuthPanel, AuthPrompt } from './authPanel';
import { Alert, AuthForm, describedBy, Field, PasswordInput, PasswordRules, SubmitButton } from './fields';
import styles from './authForm.module.css';

/**
 * The page has already checked `token`. `email` is the account's, so a password manager saves the new password
 * against the right login.
 */
export function ResetPasswordPanel({ token, email }: { token: string; email: string }) {
  const t = useTranslations('public.auth.resetPassword');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<{ message: string; field: 'password' | 'confirm' | null } | null>(null);
  const ids = { error: `${id}-error`, password: `${id}-password`, confirm: `${id}-confirm`, rules: `${id}-rules` };

  useEffect(() => {
    if (done) titleRef.current?.focus();
  }, [done]);

  useEffect(() => {
    if (!error) return;
    const field = error.field === 'confirm' ? confirmRef.current : passwordRef.current;
    field?.focus();
    field?.select();
  }, [error]);

  const fail = (message: string, field: 'password' | 'confirm' | null = null) => {
    setPending(false);
    setError({ message, field });
  };

  const save = async () => {
    if (pending) return;
    if (!password) return fail(tFields('errors.passwordRequired'), 'password');
    if (!confirm) return fail(tFields('errors.confirmRequired'), 'confirm');
    const parsed = ResetPasswordSchema.safeParse({ token, newPassword: password, confirmPassword: confirm });
    if (!parsed.success) {
      const field = parsed.error.errors[0]?.path[0];
      if (field === 'token') fail(t('errors.invalidToken'));
      else if (field === 'confirmPassword') fail(tFields('errors.passwordsDoNotMatch'), 'confirm');
      else fail(tFields('errors.weakPassword'), 'password');
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: parsed.data.newPassword,
        token: parsed.data.token,
      });
      if (resetError) {
        if (resetError.status === 429) fail(tFields('errors.tooManyRequests'));
        else if (resetError.code === 'INVALID_TOKEN') fail(t('errors.invalidToken'));
        else if (resetError.code === 'WEAK_PASSWORD') fail(tFields('errors.weakPassword'), 'password');
        else fail(t('errors.generic'));
        return;
      }
      setPending(false);
      setDone(true);
    } catch {
      fail(t('errors.generic'));
    }
  };

  if (done) {
    return (
      <AuthPanel title={t('doneTitle')} lede={t('doneLede')} titleRef={titleRef}>
        <AuthAction href='/signin' label={t('signIn')} />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title={t('title')}
      lede={t('lede')}
      foot={<AuthPrompt lead={t('remember')} href='/signin' label={t('signIn')} />}
    >
      <AuthForm
        className={cn(styles.root, styles.form)}
        pending={pending}
        describedBy={error ? ids.error : undefined}
        onSubmit={save}
      >
        {error ? <Alert id={ids.error}>{error.message}</Alert> : null}
        <input type='email' name='username' autoComplete='username' value={email} readOnly hidden />
        <Field id={ids.password} label={tFields('newPassword')}>
          <PasswordInput
            id={ids.password}
            name='newPassword'
            inputRef={passwordRef}
            value={password}
            onChange={setPassword}
            readOnly={pending}
            isNew
            invalid={error?.field === 'password'}
            describedBy={describedBy(error && ids.error, ids.rules)}
          />
        </Field>
        <PasswordRules id={ids.rules} password={password} />
        <Field id={ids.confirm} label={tFields('confirmPassword')}>
          <PasswordInput
            id={ids.confirm}
            name='confirmPassword'
            inputRef={confirmRef}
            value={confirm}
            onChange={setConfirm}
            readOnly={pending}
            isNew
            invalid={error?.field === 'confirm'}
            describedBy={describedBy(error && ids.error)}
          />
        </Field>
        <SubmitButton pending={pending} label={t('submit')} pendingLabel={t('submitting')} />
      </AuthForm>
    </AuthPanel>
  );
}
