'use client';

import * as React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FlagIcon } from '@/components/FlagIcon';
import { AvailableLocales, LOCALE_TO_ALPHA2, LOCALES } from '@/locale';
import i18n from 'i18next';

type LocaleSelectProps = Omit<React.ComponentProps<typeof SelectTrigger>, 'children'> & {
  selectProps?: React.ComponentProps<typeof Select>;
};

export function LocaleSelect({ className, style, selectProps }: LocaleSelectProps) {
  const [locale, setLocale] = React.useState<AvailableLocales>(i18n.language as AvailableLocales);

  const changeLocale = (newLocale: AvailableLocales) => {
    i18n.changeLanguage(newLocale);
    setLocale(newLocale);
  };

  return (
    <Select value={locale} onValueChange={(val) => changeLocale(val as AvailableLocales)} {...selectProps}>
      <SelectTrigger className={className} style={style}>
        <SelectValue>
          <div className="flex items-center gap-1 p-0 m-0">
            <FlagIcon alpha2={LOCALE_TO_ALPHA2[locale]} className="p-1 w-4 h-4" />
            {locale.toUpperCase()}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <div className="flex items-center gap-1 p-0 m-0">
              <FlagIcon alpha2={LOCALE_TO_ALPHA2[loc]} className="p-1 w-4 h-4" />
              {loc.toUpperCase()}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
