'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/landing/lib/cn';
import { PanelLink } from './authPanel';
import { Alert, AuthForm, describedBy, EmailInput, Field, isEmailAddress, SubmitButton } from './fields';
import styles from './authForm.module.css';

/**
 * A new verification link. Signed in, it goes to the account's address in one click; signed out, to the address
 * typed, and the note after never says whether that address has an account waiting. `back` is the way on without one.
 */
export function ResendVerification({
  accountEmail,
  back,
}: {
  accountEmail?: string;
  back: { href: string; label: string };
}) {
  const t = useTranslations('public.auth.verifyEmail.resend');
  const tFields = useTranslations('public.auth.fields');
  const id = useId();
  const noteRef = useRef<HTMLParagraphElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(accountEmail ?? '');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; aboutEmail: boolean } | null>(null);
  // bumped to put the cursor back in the field, once the form is on screen
  const [refocus, setRefocus] = useState(0);
  const ids = { error: `${id}-error`, email: `${id}-email` };

  // the note replaces the form: it takes focus, so it is read out
  useEffect(() => {
    if (sentTo) noteRef.current?.focus();
  }, [sentTo]);

  useEffect(() => {
    if (!refocus) return;
    emailRef.current?.focus();
    emailRef.current?.select();
  }, [refocus]);

  const fail = (message: string, aboutEmail = false) => {
    setPending(false);
    setError({ message, aboutEmail });
    if (!accountEmail) setRefocus((count) => count + 1);
  };

  const send = async () => {
    if (pending) return;
    if (!email.trim()) return fail(tFields('errors.emailRequired'), true);
    if (!isEmailAddress(email)) return fail(tFields('errors.invalidEmail'), true);
    setError(null);
    setPending(true);
    try {
      const { error: sendError } = await authClient.sendVerificationEmail({ email: email.trim() });
      if (sendError) {
        if (sendError.status === 429) fail(tFields('errors.tooManyRequests'));
        else if (sendError.code === 'EMAIL_ALREADY_VERIFIED') fail(t('alreadyVerified'));
        else fail(t('failed'));
        return;
      }
      setPending(false);
      setSentTo(email.trim());
    } catch {
      fail(t('failed'));
    }
  };

  const backLink = (
    <PanelLink className={styles.secondary} href={back.href}>
      {back.label}
    </PanelLink>
  );

  if (sentTo) {
    return (
      <div className={styles.root}>
        <p ref={noteRef} tabIndex={-1} className={styles.note}>
          {t(accountEmail ? 'sent' : 'sentIfWaiting', { email: sentTo })}
        </p>
        {accountEmail ? null : (
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
        )}
        {backLink}
      </div>
    );
  }

  return (
    <AuthForm
      className={cn(styles.root, styles.form)}
      pending={pending}
      describedBy={error ? ids.error : undefined}
      onSubmit={send}
    >
      {error ? <Alert id={ids.error}>{error.message}</Alert> : null}
      {accountEmail ? (
        <p className={styles.note}>{t('to', { email: accountEmail })}</p>
      ) : (
        <Field id={ids.email} label={tFields('email')}>
          <EmailInput
            id={ids.email}
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            readOnly={pending}
            invalid={error?.aboutEmail}
            describedBy={describedBy(error && ids.error)}
          />
        </Field>
      )}
      <SubmitButton pending={pending} label={t('submit')} pendingLabel={t('submitting')} />
      {backLink}
    </AuthForm>
  );
}
