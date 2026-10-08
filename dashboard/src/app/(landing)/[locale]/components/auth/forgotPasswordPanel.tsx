'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ForgotPasswordSchema } from '@/entities/auth/passwordReset.entities';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import { AuthPanel, AuthPrompt } from './authPanel';
import { Alert, EmailInput, Field, SubmitButton } from './fields';
import styles from './authForm.module.css';

/** One field, then a note to check the inbox that never says whether the account exists. */
export function ForgotPasswordPanel() {
  const t = useTranslations('public.auth.forgotPassword');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { error: `${id}-error`, email: `${id}-email` };

  const send = async () => {
    if (pending) return;
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(tFields('errors.invalidEmail'));
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: '/reset-password',
      });
      setPending(false);
      if (resetError) {
        setError(resetError.status === 429 ? tFields('errors.tooManyRequests') : t('errors.failed'));
        return;
      }
      setSentTo(parsed.data.email);
    } catch {
      setPending(false);
      setError(t('errors.failed'));
    }
  };

  return (
    <AuthPanel
      title={sentTo ? t('sentTitle') : t('title')}
      lede={sentTo ?? t('lede')}
      foot={<AuthPrompt lead={t('remember')} href='/signin' label={t('signIn')} />}
    >
      {sentTo ? (
        <div className={styles.root} role='status'>
          <p className={styles.note}>{t('sentBody', { email: sentTo })}</p>
          <button
            type='button'
            className={styles.secondary}
            onClick={() => {
              setSentTo(null);
              setEmail('');
            }}
          >
            {t('differentEmail')}
          </button>
        </div>
      ) : (
        <form
          className={cn(styles.root, styles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          aria-describedby={error ? ids.error : undefined}
        >
          {error ? <Alert id={ids.error}>{error}</Alert> : null}
          <Field id={ids.email} label={tFields('email')}>
            <EmailInput
              id={ids.email}
              value={email}
              onChange={setEmail}
              disabled={pending}
              invalid={Boolean(error)}
            />
          </Field>
          <SubmitButton pending={pending} label={t('submit')} pendingLabel={t('submitting')} />
        </form>
      )}
    </AuthPanel>
  );
}
