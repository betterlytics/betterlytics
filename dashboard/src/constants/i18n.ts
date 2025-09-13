import type { FlagIconProps } from '@/components/icons/FlagIcon';

export const SUPPORTED_LANGUAGES = ['en', 'da', 'it'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_METADATA: Record<SupportedLanguages, { name: string; code: FlagIconProps['countryCode'] }> =
  {
    en: { name: 'English', code: 'GB' },
    da: { name: 'Dansk', code: 'DK' },
    it: { name: 'Italiano', code: 'IT' },
  };
