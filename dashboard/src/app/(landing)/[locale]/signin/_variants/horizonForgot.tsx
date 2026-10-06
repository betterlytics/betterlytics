'use client';

import { useId, useState } from 'react';
import { forgotPasswordAction } from '@/app/actions/auth/passwordReset.action';
import { ForgotPasswordSchema } from '@/entities/auth/passwordReset.entities';
import { Link } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';
import { ArrowLeftIcon, MailIcon, Spinner } from '@/landing/signin/_auth/icons';
import { Alert, Field } from '@/landing/signin/_auth/signInForm';
import form from '@/landing/signin/_auth/signInForm.module.css';
import type { FlowProps } from '@/landing/signin/_auth/types';
import { HorizonHeading, HorizonTile } from './horizonStage';
import styles from './horizon.module.css';

/** Horizon's password reset: one field, then a note to check the inbox that never says whether the account exists. */
export function HorizonForgot({ copy, preview, hrefs }: FlowProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(preview === 'sent' ? copy.emailExample : null);
  const [pending, setPending] = useState(preview === 'loading');
  const [error, setError] = useState<string | null>(preview === 'error' ? copy.forgotErrors.failed : null);
  const ids = { error: `${id}-error`, email: `${id}-email` };

  const send = async () => {
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(copy.forgotErrors.invalidEmail);
      return;
    }
    setError(null);
    setPending(true);
    const sent = await forgotPasswordAction(parsed.data);
    setPending(false);
    if (sent) setSentTo(parsed.data.email);
    else setError(copy.forgotErrors.failed);
  };

  return (
    <div className={styles.stage}>
      <HorizonTile pending={pending} icon={sentTo ? <MailIcon className='size-7 text-fg' /> : undefined} />
      <HorizonHeading
        title={sentTo ? copy.sentTitle : copy.forgotTitle}
        lede={sentTo ? sentTo : copy.forgotLede}
      />

      {sentTo ? (
        <div className={cn(form.root, 'mt-8 w-full')} role='status'>
          <p className={styles.sent}>{copy.sentBody.replace('{email}', sentTo)}</p>
          <button
            type='button'
            className={form.secondary}
            onClick={() => {
              setSentTo(null);
              setEmail('');
            }}
          >
            {copy.differentEmail}
          </button>
        </div>
      ) : (
        <form
          className={cn(form.root, form.form, 'mt-10 w-full')}
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          aria-describedby={error ? ids.error : undefined}
        >
          {error ? <Alert id={ids.error}>{error}</Alert> : null}
          <Field id={ids.email} label={copy.emailLabel}>
            <input
              id={ids.email}
              className={cn(form.input, form.control)}
              type='email'
              name='email'
              autoComplete='email'
              inputMode='email'
              spellCheck={false}
              required
              autoFocus
              placeholder={copy.emailExample}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
              aria-invalid={error ? true : undefined}
            />
          </Field>
          <button type='submit' className={form.primary} disabled={pending} aria-busy={pending}>
            {pending ? (
              <>
                <Spinner className={form.spin} />
                {copy.sendingLink}
              </>
            ) : (
              copy.sendLink
            )}
          </button>
        </form>
      )}

      <Link
        href={hrefs.signIn}
        className='group mt-8 inline-flex items-center gap-2 text-label text-on-volt/70 transition-colors duration-180 ease-out-expo hover:text-on-volt'
      >
        <ArrowLeftIcon className='size-3.5 transition-transform duration-180 ease-out-expo group-hover:-translate-x-0.5' />
        {copy.backToSignIn}
      </Link>
    </div>
  );
}
