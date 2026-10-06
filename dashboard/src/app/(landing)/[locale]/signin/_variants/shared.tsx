import { Link } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';
import { LINKS } from '@/landing/lib/links';
import type { SignInCopy } from '@/landing/signin/_auth/copy';

/** Underlined so it isn't told from its sentence by colour alone (as in the landing footer). */
export const FINE_LINK =
  'underline decoration-rule-30 underline-offset-[3px] transition-colors duration-180 ease-out-expo hover:text-fg hover:decoration-current';

export function SignUpPrompt({
  copy,
  registration,
  className,
  linkClassName,
  href = '/signup',
}: {
  copy: SignInCopy;
  registration: boolean;
  className?: string;
  linkClassName?: string;
  href?: string;
}) {
  if (!registration) return <p className={cn('text-label text-muted', className)}>{copy.selfHosted}</p>;
  return (
    <p className={cn('text-label text-muted', className)}>
      {copy.newHere}{' '}
      <Link className={cn('font-medium text-fg', FINE_LINK, linkClassName)} href={href}>
        {copy.createAccount}
      </Link>
    </p>
  );
}

export function LegalLinks({
  copy,
  status = true,
  className,
}: {
  copy: SignInCopy;
  status?: boolean;
  className?: string;
}) {
  const link = 'transition-colors duration-180 ease-out-expo hover:text-fg';
  return (
    <nav className={cn('flex items-center gap-5 text-caption text-muted', className)} aria-label='Legal'>
      <Link className={link} href='/privacy'>
        {copy.privacy}
      </Link>
      <Link className={link} href='/terms'>
        {copy.terms}
      </Link>
      {status ? (
        <a className={link} href={LINKS.status}>
          {copy.status}
        </a>
      ) : null}
    </nav>
  );
}

export function Copyright({ className }: { className?: string }) {
  return <span className={className}>© {new Date().getFullYear()} Betterlytics</span>;
}
