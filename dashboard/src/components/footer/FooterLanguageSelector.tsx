'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { SUPPORTED_LANGUAGES, type SupportedLanguages, LANGUAGE_METADATA } from '@/constants/i18n';
import { CountryDisplay } from '@/components/language/CountryDisplay';

export function FooterLanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label='Change language'
          className='text-foreground/90 hover:text-foreground inline-flex items-center gap-2 rounded-md py-1 text-sm transition-colors'
        >
          <Globe className='text-muted-foregroundh-5 w-5' />
          <span className='font-medium'>{LANGUAGE_METADATA[locale as SupportedLanguages].name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => {
              router.push(pathname, { locale: lang });
              router.refresh();
            }}
            className='cursor-pointer'
          >
            <CountryDisplay
              countryCode={LANGUAGE_METADATA[lang].code}
              countryName={LANGUAGE_METADATA[lang].name}
              className='py-0 pl-0'
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
