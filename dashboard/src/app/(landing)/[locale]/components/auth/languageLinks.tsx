'use client';

import { useSearchParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import { usePathname } from '@/i18n/navigation';
import { LanguageLinks } from '@/landing/components/ui/languageLinks';

/** This page in each language, keeping its query: the callbackUrl, reset token or invite stays with the visitor. */
export function CurrentPageLanguageLinks(props: Omit<ComponentProps<typeof LanguageLinks>, 'href'>) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  return <LanguageLinks {...props} href={query ? `${pathname}?${query}` : pathname} />;
}
