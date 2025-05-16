'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { dictionaries, DEFAULT_LOCALE } from '@/locale/index';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: dictionaries.en },
      da: { translation: dictionaries.da },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    keySeparator: '.', 
  });
}

export default i18n;
