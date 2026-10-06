'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import type { SignInCopy } from './copy';
import type { Method, OAuthProvider, PreviewState } from './types';

const LAST_USED_KEY = 'betterlytics:last-sign-in';
const CALLBACK_URL = '/dashboards';

function readLastUsed(): Method | null {
  try {
    const stored = window.localStorage.getItem(LAST_USED_KEY);
    return stored === 'email' || stored === 'google' || stored === 'github' ? stored : null;
  } catch {
    return null;
  }
}

function rememberMethod(method: Method) {
  try {
    window.localStorage.setItem(LAST_USED_KEY, method);
  } catch {}
}

/** Credentials, OAuth and the inline two-factor step, shared by every direction. */
export function useSignIn(copy: SignInCopy, preview: PreviewState) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>(preview === 'otp' ? 'otp' : 'credentials');
  const [error, setError] = useState<string | null>(
    preview === 'error' ? copy.errors.invalidCredentials : copy.pageError,
  );
  const [pending, setPending] = useState<Method | null>(preview === 'loading' ? 'email' : null);
  const [lastUsed, setLastUsed] = useState<Method | null>(null);

  useEffect(() => setLastUsed(readLastUsed()), []);

  const submit = async (code = totp) => {
    if (pending) return;
    setError(null);
    setPending('email');
    try {
      const result = await signIn('credentials', {
        email,
        password,
        totp: code,
        redirect: false,
        callbackUrl: CALLBACK_URL,
      });
      if (result?.error) {
        setPending(null);
        if (result.error === 'missing_otp') {
          setStep('otp');
        } else if (result.error === 'invalid_otp') {
          setTotp('');
          setError(copy.errors.invalidOtp);
        } else {
          setError(copy.errors.invalidCredentials);
        }
        return;
      }
      rememberMethod('email');
      // the app is another root layout, so this is a full load either way
      window.location.assign(result?.url ?? CALLBACK_URL);
    } catch {
      setPending(null);
      setError(copy.errors.generic);
    }
  };

  const continueWith = async (provider: OAuthProvider) => {
    if (pending) return;
    setError(null);
    setPending(provider);
    rememberMethod(provider);
    try {
      await signIn(provider, { callbackUrl: CALLBACK_URL });
    } catch {
      setPending(null);
      setError(copy.errors.generic);
    }
  };

  const backToCredentials = () => {
    setStep('credentials');
    setTotp('');
    setError(null);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    totp,
    setTotp,
    step,
    error,
    pending,
    lastUsed,
    submit,
    continueWith,
    backToCredentials,
  };
}

export type SignInState = ReturnType<typeof useSignIn>;
