// src/global.d.ts
import messages from '@/dictionaries/en.json'; // use your default-locale file
import type { SupportedLanguages } from './constants/supportedLanguages';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
    Locale: SupportedLanguages;

    // Optional: To lock down date-time formats
    // Formats: typeof formats;
  }
}
