import type { JSX } from 'react';
import type { WhatsNewMetadata } from '@/entities/whats-new';
import type { SupportedLanguages } from '@/constants/i18n';
import type { WhatsNewEntry } from './index';

type LocaleModule = {
  metadata: WhatsNewMetadata;
  default: () => JSX.Element;
};

type LocaleModuleMap = Record<SupportedLanguages, LocaleModule>;

export function buildLocaleEntrySelector(modules: LocaleModuleMap, defaultLocale: SupportedLanguages = 'en') {
  const entries = Object.fromEntries(
    Object.entries(modules).map(([locale, mod]) => [
      locale,
      {
        ...mod.metadata,
        Content: mod.default,
      } satisfies WhatsNewEntry,
    ]),
  ) as Record<SupportedLanguages, WhatsNewEntry>;

  const getForLocale = (locale: SupportedLanguages): WhatsNewEntry =>
    entries[locale as SupportedLanguages] ?? entries[defaultLocale];

  return { entries, getForLocale };
}
