'use client';

import { Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';

/**
 * This page in each language, keeping its query: the callbackUrl, reset token or invite stays with the visitor. Plain
 * links, as in the landing footer; following one also sets the locale cookie.
 */
export function LanguageLinks({
  label,
  languages,
}: {
  label: string;
  languages: { code: SupportedLanguages; name: string }[];
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const href = query ? `${pathname}?${query}` : pathname;
  return (
    <div className='flex items-center gap-2 text-caption'>
      <Globe aria-hidden className='size-3.5 flex-none text-muted' />
      <ul aria-label={label} className='flex flex-wrap gap-x-3.5'>
        {languages.map(({ code, name }) => (
          <li key={code}>
            <Link
              className={cn(
                'transition-colors duration-180 ease-out-expo',
                code === locale ? 'text-fg' : 'text-muted hover:text-fg',
              )}
              href={href}
              locale={code}
              lang={code}
              prefetch={false}
              aria-current={code === locale ? 'page' : undefined}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
