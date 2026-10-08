'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ForgotPasswordSchema } from '@/entities/auth/passwordReset.entities';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import { AuthPanel, AuthPrompt } from './authPanel';
import { Alert, AuthForm, EmailInput, Field, SubmitButton } from './fields';
import styles from './authForm.module.css';

/** One field, then a note to check the inbox that never says whether the account exists. */
export function ForgotPasswordPanel() {
  const t = useTranslations('public.auth.forgotPassword');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // bumped to put the cursor back in the field, once the form is on screen
  const [refocus, setRefocus] = useState(0);
  const ids = { error: `${id}-error`, email: `${id}-email` };

  // the sent note replaces the form, button and all: the new heading takes focus, so it is read out
  useEffect(() => {
    if (sentTo) titleRef.current?.focus();
  }, [sentTo]);

  useEffect(() => {
    if (!refocus) return;
    emailRef.current?.focus();
    emailRef.current?.select();
  }, [refocus]);

  const fail = (message: string) => {
    setPending(false);
    setError(message);
    setRefocus((count) => count + 1);
  };

  const send = async () => {
    if (pending) return;
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      fail(tFields('errors.invalidEmail'));
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: '/reset-password',
      });
      if (resetError) {
        fail(resetError.status === 429 ? tFields('errors.tooManyRequests') : t('errors.failed'));
        return;
      }
      setPending(false);
      setSentTo(parsed.data.email);
    } catch {
      fail(t('errors.failed'));
    }
  };

  return (
    <AuthPanel
      title={sentTo ? t('sentTitle') : t('title')}
      lede={sentTo ?? t('lede')}
      titleRef={titleRef}
      foot={<AuthPrompt lead={t('remember')} href='/signin' label={t('signIn')} />}
    >
      {sentTo ? (
        <div className={styles.root}>
          <p className={styles.note}>{t('sentBody', { email: sentTo })}</p>
          <button
            type='button'
            className={styles.secondary}
            onClick={() => {
              setSentTo(null);
              setEmail('');
              setRefocus((count) => count + 1);
            }}
          >
            {t('differentEmail')}
          </button>
        </div>
      ) : (
        <AuthForm
          className={cn(styles.root, styles.form)}
          pending={pending}
          describedBy={error ? ids.error : undefined}
          onSubmit={send}
        >
          {error ? <Alert id={ids.error}>{error}</Alert> : null}
          <Field id={ids.email} label={tFields('email')}>
            <EmailInput
              id={ids.email}
              inputRef={emailRef}
              value={email}
              onChange={setEmail}
              readOnly={pending}
              invalid={Boolean(error)}
            />
          </Field>
          <SubmitButton pending={pending} label={t('submit')} pendingLabel={t('submitting')} />
        </AuthForm>
      )}
    </AuthPanel>
  );
}
