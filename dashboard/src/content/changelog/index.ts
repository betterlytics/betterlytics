import type { SupportedLanguages } from '@/constants/i18n';
import type { ChangelogEntry, ChangelogEntryData } from '@/entities/system/changelog.entities';
import { createChangelogEntry } from './entry-renderer';
import { changelogEntriesEn, latestChangelogModalEn } from './locales/en';
import { changelogEntriesDa, latestChangelogModalDa } from './locales/da';
import { changelogEntriesIt, latestChangelogModalIt } from './locales/it';
import { changelogEntriesNb, latestChangelogModalNb } from './locales/nb';

export type { ChangelogEntry } from '@/entities/system/changelog.entities';

const defaultLocale = (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'en') as SupportedLanguages;

function mapEntries(entries: readonly ChangelogEntryData[]): readonly ChangelogEntry[] {
  return entries.map((entry) => createChangelogEntry(entry));
}

const enEntries = mapEntries(changelogEntriesEn);
const daEntries = mapEntries(changelogEntriesDa);
const itEntries = mapEntries(changelogEntriesIt);
const nbEntries = mapEntries(changelogEntriesNb);

const changelogEntriesByLocale: Record<SupportedLanguages, readonly ChangelogEntry[]> = {
  en: enEntries,
  da: daEntries,
  it: itEntries,
  nb: nbEntries,
};

const modalEntriesByLocale: Record<SupportedLanguages, ChangelogEntry> = {
  en: createChangelogEntry(latestChangelogModalEn),
  da: createChangelogEntry(latestChangelogModalDa),
  it: createChangelogEntry(latestChangelogModalIt),
  nb: createChangelogEntry(latestChangelogModalNb),
};

export const currentChangelogModalDisplay: ChangelogEntry = modalEntriesByLocale[defaultLocale];

export function getCurrentChangelogModalDisplayForLocale(locale: SupportedLanguages): ChangelogEntry {
  return modalEntriesByLocale[locale] ?? modalEntriesByLocale[defaultLocale];
}

export function getChangelogEntriesForLocale(locale: SupportedLanguages): readonly ChangelogEntry[] {
  return changelogEntriesByLocale[locale] ?? changelogEntriesByLocale[defaultLocale];
}
