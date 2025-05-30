'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';

import { FlagIcon, type FlagIconProps } from '@/components/FlagIcon';
import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/dictionaries/dictionaries';

const LANGUAGE_TO_COUNTRYCODE = {
  en: 'GB',
  da: 'DK',
} satisfies Record<SupportedLanguages, FlagIconProps['countryCode']>;

type LanguageSelectProps = {
  onUpdate: React.Dispatch<SupportedLanguages>;
  value?: string;
  id?: string;
};

export function LanguageSelect({ onUpdate, value: language, id }: LanguageSelectProps) {
  return (
    <Select value={language} onValueChange={onUpdate}>
      <SelectTrigger id={id}>
        <SelectValue>
          {language && (
            <div className='m-0 flex items-center gap-2 p-0'>
              <FlagIcon
                countryCode={LANGUAGE_TO_COUNTRYCODE[language as SupportedLanguages]}
                className='h-4 w-4'
              />
              <span>{language.toUpperCase()}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            <div className='m-0 flex items-center gap-2 p-0'>
              <FlagIcon countryCode={LANGUAGE_TO_COUNTRYCODE[lang]} className='h-4 w-4' />
              <span>{lang.toUpperCase()}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
