import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-2-1';
import * as DaModule from './v1-2-1.da';
import * as ItModule from './v1-2-1.it';

const { entries: v121EntriesByLocale, getForLocale: getV121EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v121EntriesByLocale, getV121EntryForLocale };
