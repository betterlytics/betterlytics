'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';
import { CheckIcon } from './icons';
import styles from './languageMenu.module.css';

/**
 * Keeps the query (callbackUrl, reset token, invite). A menu of links rather than the landing's row, so the footer
 * stays within the panel's lines; a select would navigate on every arrow key. The auth pages aren't indexed, so
 * crawlers following the links don't matter.
 */
export function LanguageMenu({
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
  const current = languages.find((language) => language.code === locale);

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className={cn(styles.trigger, 'text-caption')}
        aria-label={`${label}: ${current?.name ?? locale}`}
      >
        <Globe aria-hidden />
        <span>{current?.name ?? locale}</span>
        <ChevronDown aria-hidden className={styles.chevron} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.menu} side='top' align='center' sideOffset={8} aria-label={label}>
          {languages.map(({ code, name }) => (
            <DropdownMenu.Item key={code} asChild className={styles.item}>
              <Link
                href={href}
                locale={code}
                lang={code}
                prefetch={false}
                aria-current={code === locale ? 'page' : undefined}
              >
                {name}
                {code === locale ? <CheckIcon /> : null}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
