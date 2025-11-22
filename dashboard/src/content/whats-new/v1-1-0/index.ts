import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-1-0';
import * as DaModule from './v1-1-0.da';
import * as ItModule from './v1-1-0.it';

const { entries: v110EntriesByLocale, getForLocale: getV110EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v110EntriesByLocale, getV110EntryForLocale };
