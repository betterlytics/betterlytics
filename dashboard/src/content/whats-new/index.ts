import type { WhatsNewMetadata } from '@/entities/whats-new';
import type { SupportedLanguages } from '@/constants/i18n';
import { getLatestModalForLocale, latestModalEntriesByLocale } from './latest-modal';
import { getV124EntryForLocale } from './v1-2-4';
import { getV123EntryForLocale } from './v1-2-3';
import type { JSX } from 'react';

const DEFAULT_LOCALE: SupportedLanguages = 'en';

export type WhatsNewEntry = WhatsNewMetadata & {
  Content: () => JSX.Element;
};

export const currentWhatsNewModalDisplay: WhatsNewEntry = latestModalEntriesByLocale[DEFAULT_LOCALE];

export function getCurrentWhatsNewModalDisplayForLocale(locale: SupportedLanguages): WhatsNewEntry {
  return getLatestModalForLocale(locale);
}

export function getChangelogEntriesForLocale(locale: SupportedLanguages): readonly WhatsNewEntry[] {
  return [getV124EntryForLocale(locale), getV123EntryForLocale(locale)];
}
