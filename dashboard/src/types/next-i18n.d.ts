import messages from '../../messages/en.json';
import type { SupportedLanguages } from '../constants/supportedLanguages';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
    Locale: SupportedLanguages;

    // Optional: To lock down date-time formats
    // Formats: typeof formats;
  }
}
