import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-2-3';
import * as DaModule from './v1-2-3.da';
import * as ItModule from './v1-2-3.it';

const { entries: v123EntriesByLocale, getForLocale: getV123EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v123EntriesByLocale, getV123EntryForLocale };
