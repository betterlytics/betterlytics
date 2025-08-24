'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';

import { type FlagIconProps } from '@/components/icons/FlagIcon';
import { SupportedLanguages } from '@/dictionaries/dictionaries';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { SUPPORTED_LANGUAGES } from '@/constants/supportedLanguages';

type LanguageSelectProps = {
  onUpdate: React.Dispatch<SupportedLanguages>;
  value?: SupportedLanguages;
  id?: string;
};

const LANGUAGE = {
  da: { name: 'Dansk', code: 'DK' },
  en: { name: 'English', code: 'GB' },
} satisfies Record<SupportedLanguages, { name: string; code: FlagIconProps['countryCode'] }>;

export function LanguageSelect({ onUpdate, value: language, id }: LanguageSelectProps) {
  return (
    <Select value={language} onValueChange={onUpdate}>
      <SelectTrigger id={id}>
        <SelectValue>
          {language && (
            <CountryDisplay countryCode={LANGUAGE[language].code} countryName={LANGUAGE[language].name} />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            <CountryDisplay countryCode={LANGUAGE[lang].code} countryName={LANGUAGE[lang].name} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
