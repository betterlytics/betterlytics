'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, HelpCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CUSTOM_DOMAIN_DOCS_URL = 'https://betterlytics.io/docs/integration/custom-status-page-domain';

/** The CNAME target a custom domain must point at. Embeds the slug, so it moves when the slug changes. */
export function statusPageCnameTarget(slug: string, publicHost: string): string {
  return `${slug}.status.${publicHost}`;
}

/** Small (?) link to the custom-domain setup docs, sits next to the "Custom domain" field label. */
export function CustomDomainHelpLink() {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <a
      href={CUSTOM_DOMAIN_DOCS_URL}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={t('customDomainSetup.helpLabel')}
      title={t('customDomainSetup.helpLabel')}
      className='text-muted-foreground hover:text-foreground inline-flex'
    >
      <HelpCircle className='h-3.5 w-3.5' />
    </a>
  );
}

type CustomDomainSetupProps = {
  customDomain: string;
  slug: string;
  publicHost: string;
  isValid: boolean;
};

/**
 * DNS setup instructions shown whenever a valid custom domain is entered. The CNAME target embeds the
 * slug ({slug}.status.{publicHost}), so changing the slug moves the target.
 */
export function CustomDomainSetup({ customDomain, slug, publicHost, isValid }: CustomDomainSetupProps) {
  const t = useTranslations('statusPagesPage.editor');
  const [copied, setCopied] = useState(false);

  const domain = customDomain.trim();
  if (!domain || !isValid || !slug.trim()) return null;

  const target = statusPageCnameTarget(slug, publicHost);
  // Many providers (Namecheap, Cloudflare, GoDaddy…) auto-append the domain, so the Name field wants
  // just the subdomain label. Show the first label as the example.
  const hostLabel = domain.split('.')[0];

  const copyTarget = () => {
    navigator.clipboard.writeText(target);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className='space-y-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4'>
      <div className='flex items-center gap-2'>
        <Info className='h-4 w-4 flex-none text-blue-600 dark:text-blue-400' />
        <p className='text-muted-foreground text-xs'>
          {t.rich('customDomainSetup.intro', {
            domain,
            strong: (chunks) => <span className='text-foreground font-medium'>{chunks}</span>,
          })}
        </p>
      </div>
      <div className='border-border bg-card grid gap-3 rounded-md border p-3 sm:grid-cols-[auto_fit-content(40%)_minmax(0,1fr)] sm:gap-0'>
        <DnsField label={t('customDomainSetup.recordType')} className='sm:pr-4'>
          <span className='font-mono text-sm'>CNAME</span>
        </DnsField>
        <DnsField label={t('customDomainSetup.recordName')} className='sm:border-border sm:border-l sm:px-4'>
          <span className='font-mono text-sm break-all'>{domain}</span>
        </DnsField>
        <DnsField label={t('customDomainSetup.recordValue')} className='sm:border-border sm:border-l sm:pl-4'>
          <div className='flex items-center gap-2'>
            <span className='font-mono text-sm break-all'>{target}</span>
            <button
              type='button'
              onClick={copyTarget}
              aria-label={t('customDomainSetup.copy')}
              title={t('customDomainSetup.copy')}
              className='text-muted-foreground hover:text-foreground hover:bg-muted flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-md transition-colors'
            >
              {copied ? <Check className='h-3.5 w-3.5 text-emerald-500' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
        </DnsField>
      </div>
      <p className='text-muted-foreground text-xs'>
        {t.rich('customDomainSetup.nameHint', {
          label: hostLabel,
          domain,
          mono: (chunks) => <span className='text-foreground font-mono font-medium'>{chunks}</span>,
          monoBreak: (chunks) => <span className='text-foreground font-mono font-medium break-all'>{chunks}</span>,
        })}
      </p>
      <p className='text-muted-foreground text-xs'>{t('customDomainSetup.propagation')}</p>
    </div>
  );
}

function DnsField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>{label}</div>
      {children}
    </div>
  );
}
