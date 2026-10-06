import { BrandLink } from '@/landing/components/ui/brandMark';
import { Corners } from '@/landing/components/ui/frame';
import frame from '@/landing/components/ui/frame.module.css';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { cn } from '@/landing/lib/cn';
import { LINKS } from '@/landing/lib/links';
import { GitHubMark } from '@/landing/signin/_auth/icons';
import { SignInForm } from '@/landing/signin/_auth/signInForm';
import type { VariantProps } from '@/landing/signin/_auth/types';
import { Copyright, LegalLinks, SignUpPrompt } from './shared';
import styles from './linework.module.css';

/**
 * The sign-in panel inked in: corner squares, rules between its parts, its edges carried out as construction lines.
 * `mono` adds the eyebrow and sets the field labels in the landing's uppercase mono.
 */
export function LineworkPanel({ className, mono = true, ...props }: VariantProps & { className?: string; mono?: boolean }) {
  const { copy, registration } = props;
  return (
    <InkFrame className={cn(frame.panel, styles.panel, className)}>
      <Corners persistent />
      <i className={cn(styles.guide, styles.guideX, styles.atTop)} data-guide='x' aria-hidden />
      <i className={cn(styles.guide, styles.guideX, styles.atBottom)} data-guide='x' aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atStart)} data-guide='y' aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atEnd)} data-guide='y' aria-hidden />

      <div className={styles.head}>
        {mono ? (
          <p className='mb-5 flex items-center gap-2.5 font-mono text-micro tracking-[0.08em] text-muted uppercase'>
            <i className='size-1.5 rounded-[1.5px] bg-volt-lift' aria-hidden />
            {copy.signInEyebrow}
          </p>
        ) : null}
        <h1 className='text-[1.875rem] leading-[2.125rem] font-medium tracking-[-0.05rem]'>{copy.welcomeBack}</h1>
        <p className='mt-2.5 text-body-sm text-pretty text-muted'>{copy.blueprintLede}</p>
      </div>

      <div className={styles.body}>
        <SignInForm {...props} labels={mono ? 'mono' : 'sans'} oauth='cells' order='oauth-first' />
      </div>

      <div className={cn(styles.foot, 'bg-hatch')}>
        <SignUpPrompt copy={copy} registration={registration} className='text-center' />
      </div>
    </InkFrame>
  );
}

/** B2 — the landing's panel, rules and corner squares on an open canvas; its construction lines carry the page. */
export function LineworkVariant(props: VariantProps) {
  const { copy } = props;
  return (
    <div className={styles.root}>
      <header className={styles.top}>
        <BrandLink compact />
        <div className='flex items-center gap-5 text-body font-medium tracking-ui'>
          <a className='transition-opacity duration-180 ease-out-expo hover:opacity-80' href={LINKS.docs}>
            {copy.docs}
          </a>
          <a
            className='inline-flex size-8 items-center justify-center rounded-[7px] transition-[opacity,background-color] duration-180 ease-out-expo hover:bg-fg/6 hover:opacity-80'
            href={LINKS.github}
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Betterlytics on GitHub'
          >
            <GitHubMark className='size-[17px]' />
          </a>
        </div>
      </header>

      <main className={styles.middle}>
        <LineworkPanel {...props} mono={false} />
      </main>

      <footer className={styles.bottom}>
        <Copyright className='text-caption text-muted' />
        <LegalLinks copy={copy} status={false} />
      </footer>
    </div>
  );
}
