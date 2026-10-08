'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { PanelLink } from './authPanel';
import { Spinner } from './icons';
import styles from './authForm.module.css';

/**
 * Signed in as someone other than an invitation's addressee: sign out, then back to the invitation, which sends the
 * visitor on to sign in or sign up as the address it was sent to. The way into their current account stays beside it.
 */
export function SwitchAccount({
  note,
  continueHref,
  label,
  stayHref,
  stayLabel,
}: {
  note: string;
  continueHref: string;
  label: string;
  stayHref: string;
  stayLabel: string;
}) {
  const [pending, setPending] = useState(false);

  const signOutAndContinue = async () => {
    setPending(true);
    try {
      await authClient.signOut();
    } finally {
      // a full load either way: if signing out failed, the invitation simply shows this panel again
      window.location.assign(continueHref);
    }
  };

  return (
    <div className={styles.root}>
      <p className={styles.note}>{note}</p>
      <button
        type='button'
        className={styles.primary}
        onClick={signOutAndContinue}
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {pending ? <Spinner className={styles.spin} /> : null}
        {label}
      </button>
      <PanelLink className={styles.secondary} href={stayHref}>
        {stayLabel}
      </PanelLink>
    </div>
  );
}
