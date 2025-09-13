'use client';

import { LanguageSelect } from '@/components/language/LanguageSelect';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export function FooterLanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <LanguageSelect
      value={locale}
      onUpdate={(updatedLocale) => {
        router.push(pathname, { locale: updatedLocale });
        router.refresh();
      }}
    />
  );
}
