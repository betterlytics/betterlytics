import type { WhatsNewMetadata } from '@/entities/whats-new';
import type { SupportedLanguages } from '@/constants/i18n';
import { getLatestModalForLocale, latestModalEntriesByLocale } from './latest-modal';
import { getV124EntryForLocale } from './v1-2-4';
import { getV123EntryForLocale } from './v1-2-3';
import { getV122EntryForLocale } from './v1-2-2';
import { getV121EntryForLocale } from './v1-2-1';
import { getV120EntryForLocale } from './v1-2-0';
import { getV111EntryForLocale } from './v1-1-1';
import { getV110EntryForLocale } from './v1-1-0';
import { getV102EntryForLocale } from './v1-0-2';
import { getV101EntryForLocale } from './v1-0-1';
import { getV100EntryForLocale } from './v1-0-0';
import { getV010EntryForLocale } from './v0-1-0';
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
  return [
    getV124EntryForLocale(locale),
    getV123EntryForLocale(locale),
    getV122EntryForLocale(locale),
    getV121EntryForLocale(locale),
    getV120EntryForLocale(locale),
    getV111EntryForLocale(locale),
    getV110EntryForLocale(locale),
    getV102EntryForLocale(locale),
    getV101EntryForLocale(locale),
    getV100EntryForLocale(locale),
    getV010EntryForLocale(locale),
  ];
}
