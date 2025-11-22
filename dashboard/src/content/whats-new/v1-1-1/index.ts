import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-1-1';
import * as DaModule from './v1-1-1.da';
import * as ItModule from './v1-1-1.it';

const { entries: v111EntriesByLocale, getForLocale: getV111EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v111EntriesByLocale, getV111EntryForLocale };
