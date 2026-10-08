'use client';

import { useState, type ReactNode } from 'react';
import { BrandMark, LoadingMark } from '@/landing/components/ui/brandMark';
import { SignInForm } from '@/landing/signin/_auth/signInForm';
import type { VariantProps } from '@/landing/signin/_auth/types';
import { SignUpPrompt } from './shared';
import styles from './horizon.module.css';

/** The mark in its tile, filling column by column (the app's loading logo) while a request is out; `icon` replaces it. */
export function HorizonTile({ pending, icon }: { pending: boolean; icon?: ReactNode }) {
  return (
    <div className={styles.tile} data-pending={pending || undefined}>
      {pending ? <LoadingMark className='size-8 text-fg' /> : (icon ?? <BrandMark className='size-8 text-fg' />)}
    </div>
  );
}

/** Horizon's two-line heading: the step, and a quieter line under it. */
export function HorizonHeading({ title, lede }: { title: ReactNode; lede: ReactNode }) {
  return (
    <h1 className='mt-8 text-center text-[1.625rem] leading-8 font-medium tracking-[-0.04rem]'>
      {title}
      <span className='block text-muted'>{lede}</span>
    </h1>
  );
}

/** Client half of Horizon's sign-in. */
export function HorizonStage(props: VariantProps) {
  const { copy, registration, hrefs } = props;
  const [pending, setPending] = useState(props.preview === 'loading');
  return (
    <div className={styles.stage}>
      <HorizonTile pending={pending} />
      <HorizonHeading title={copy.welcomeBack} lede={copy.horizonTitle} />
      <SignInForm
        className='mt-10 w-full'
        {...props}
        order='oauth-first'
        oauth='stack'
        disclosure
        onPendingChange={setPending}
        forgotHref={hrefs?.forgotPassword}
      />
      {/* the footer's tone: in the taller states the prompt sits on the glow */}
      <SignUpPrompt
        copy={copy}
        registration={registration}
        href={hrefs?.signUp}
        className='mt-8 text-center text-on-volt/70'
      />
    </div>
  );
}
