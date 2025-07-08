'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';

import { FlagIcon, type FlagIconProps } from '@/components/icons/FlagIcon';
import { SupportedLanguages, SUPPORTED_LANGUAGES, LANGUAGE_TO_NAME } from '@/types/language';
import { CountryDisplay } from './CountryDisplay';

type LanguageSelectProps = {
  onUpdate: React.Dispatch<SupportedLanguages>;
  value?: SupportedLanguages;
  id?: string;
};

const LANGUAGE_TO_COUNTRYCODE = {
  en: 'GB',
  da: 'DK',
} satisfies Record<SupportedLanguages, FlagIconProps['countryCode']>;

export function LanguageSelect({ onUpdate, value: language, id }: LanguageSelectProps) {
  return (
    <Select value={language} onValueChange={onUpdate}>
      <SelectTrigger id={id}>
        <SelectValue>
          {language && (
            <CountryDisplay
              countryCode={LANGUAGE_TO_COUNTRYCODE[language]}
              countryName={LANGUAGE_TO_NAME[language]}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            <CountryDisplay 
              countryCode={LANGUAGE_TO_COUNTRYCODE[lang]}
              countryName={LANGUAGE_TO_NAME[lang]}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}