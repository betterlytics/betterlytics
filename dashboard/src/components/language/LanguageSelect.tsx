'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_LANGUAGES, SupportedLanguages, LANGUAGE_METADATA } from '@/constants/i18n';

type LanguageSelectProps = {
  onUpdate: React.Dispatch<SupportedLanguages>;
  value?: SupportedLanguages;
  id?: string;
};

export function LanguageSelect({ onUpdate, value: language, id }: LanguageSelectProps) {
  return (
    <Select value={language} onValueChange={onUpdate}>
      <SelectTrigger id={id} className='cursor-pointer'>
        <SelectValue>{language && LANGUAGE_METADATA[language].name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang} className='cursor-pointer'>
            {LANGUAGE_METADATA[lang].name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
