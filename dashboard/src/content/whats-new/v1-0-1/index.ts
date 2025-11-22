import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-0-1';

const { entries: v101EntriesByLocale, getForLocale: getV101EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
});

export { v101EntriesByLocale, getV101EntryForLocale };


